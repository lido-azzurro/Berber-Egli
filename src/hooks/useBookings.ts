import { useCallback, useEffect, useState } from 'react';
import { supabase, type Booking } from '@/lib/supabase';

export function useBookedSlots(dateISO: string | null) {
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!dateISO) {
      setBookedTimes(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase.rpc('get_booked_slots', { p_date: dateISO });
    setBookedTimes(new Set((data as { slot_time: string }[] | null)?.map((row) => row.slot_time) ?? []));
    setLoading(false);
  }, [dateISO]);

  useEffect(() => {
    void refresh();
    if (!dateISO) return;
    const channel = supabase
      .channel(`slots-${dateISO}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `booking_date=eq.${dateISO}` }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [dateISO, refresh]);

  return { bookedTimes, loading };
}

export function useAllBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('bookings').select('*').order('booking_date', { ascending: true }).order('slot_time', { ascending: true });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase.channel('admin-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  return { bookings, loading, refresh };
}

export function useNewBookingsCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchCount = () => {
      void supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('seen_by_admin', false).then(({ count: next }) => setCount(next ?? 0));
    };
    fetchCount();
    const channel = supabase.channel('new-bookings-count').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchCount).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  return count;
}

export function useMyBookings(userId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void supabase.from('bookings').select('*').eq('user_id', userId).order('booking_date', { ascending: false }).order('slot_time', { ascending: false }).then(({ data }) => {
      setBookings((data as Booking[]) ?? []);
      setLoading(false);
    });
  }, [userId]);
  return { bookings, loading };
}
