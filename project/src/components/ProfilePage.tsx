import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Lock, LogOut, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyBookings } from '@/hooks/useBookings';
import { supabase, type Booking } from '@/lib/supabase';
import PasswordInput from './PasswordInput';
import { isValidAlbanianPhone } from '@/lib/phone';

type Props = { onBack: () => void };
const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
function formatDate(iso: string) { const d = new Date(`${iso}T00:00:00`); return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`; }

export default function ProfilePage({ onBack }: Props) {
  const { session, profile, updatePassword, signOut, refreshProfile } = useAuth();
  const { bookings, loading } = useMyBookings(session?.user.id ?? null);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setFullName(profile?.full_name ?? ''); setPhone(profile?.phone ?? ''); }, [profile]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session || !fullName.trim() || !phone.trim()) return;
    if (!isValidAlbanianPhone(phone)) {
      setMessage('Numri i telefonit nuk është i vlefshëm shqiptar.');
      return;
    }
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() }).eq('id', session.user.id);
    setSaving(false);
    if (error) setMessage('Profili nuk u ruajt.'); else { await refreshProfile(); setMessage('Profili u ruajt.'); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) return;
    const result = await updatePassword(password);
    setMessage(result.error ?? 'Fjalëkalimi u ndryshua.');
    if (!result.error) setPassword('');
  };

  const upcoming = bookings.filter((b) => b.booking_date >= new Date().toISOString().slice(0, 10) && b.status !== 'cancelled');
  const past = bookings.filter((b) => !upcoming.includes(b));

  return <div className="min-h-screen bg-[#0a0a0a] px-5 py-6 sm:py-10"><div className="max-w-2xl mx-auto">
    <div className="flex items-center justify-between mb-7"><div className="flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#1c1c1c]"><ArrowLeft className="w-5 h-5" /></button><h1 className="font-display text-2xl text-white">PROFILI IM</h1></div><button onClick={() => { void signOut(); onBack(); }} className="text-neutral-500 hover:text-red-400"><LogOut className="w-5 h-5" /></button></div>
    <form onSubmit={saveProfile} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-4 mb-5"><div className="flex items-center gap-2 mb-1"><User className="w-5 h-5 text-gold" /><h2 className="font-display text-xl text-white">TË DHËNAT E MIA</h2></div><label className="block text-sm text-neutral-300">Emër Mbiemër<input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none" required /></label><label className="block text-sm text-neutral-300">Numër Telefoni<input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }} onBlur={() => { if (phone && !isValidAlbanianPhone(phone)) setPhoneError('Numër i pavlefshëm.'); else setPhoneError(null); }} className={`w-full mt-2 bg-[#0a0a0a] border rounded-xl px-4 py-3 text-white focus:outline-none ${phoneError ? 'border-red-500/50 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#d4af37]'}`} required />{phoneError && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{phoneError}</p>}</label><button disabled={saving} className="bg-[#d4af37] text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Ruaj profilin</button>{message && <p className="text-sm text-gold">{message}</p>}</form>
    <form onSubmit={changePassword} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-4 mb-7"><div className="flex items-center gap-2"><Lock className="w-5 h-5 text-gold" /><h2 className="font-display text-xl text-white">SIGURIA</h2></div><label className="block text-sm text-neutral-300">Fjalëkalim i ri<PasswordInput minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Të paktën 6 karaktere" className="w-full mt-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none" required /></label><button className="bg-[#1c1c1c] text-white font-medium px-5 py-3 rounded-xl">Ndrysho fjalëkalimin</button></form>
    <section><div className="flex items-center gap-2 mb-4"><CalendarDays className="w-5 h-5 text-gold" /><h2 className="font-display text-2xl text-white">REZERVIMET E MIA</h2></div>{loading ? <div className="py-10 text-center text-neutral-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> : <div className="space-y-3">{upcoming.length > 0 && <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">Të ardhshme</p>}{upcoming.map((b) => <BookingItem key={b.id} booking={b} />)}{past.length > 0 && <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] mt-6">Historia</p>}{past.map((b) => <BookingItem key={b.id} booking={b} />)}{bookings.length === 0 && <p className="text-sm text-neutral-600 py-10 text-center">Nuk ke ende rezervime.</p>}</div>}</section>
  </div></div>;
}

function BookingItem({ booking }: { booking: Booking }) { return <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex flex-col items-center justify-center"><Clock className="w-4 h-4 text-gold" /><span className="font-display text-sm text-gold">{booking.slot_time}</span></div><div className="flex-1"><p className="text-white font-medium">{booking.service ?? 'Qethje'}</p><p className="text-xs text-neutral-500">{formatDate(booking.booking_date)}</p></div><span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'completed' ? 'bg-green-500/15 text-green-400' : booking.status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>{booking.status === 'completed' ? 'Përfunduar' : booking.status === 'cancelled' ? 'Anuluar' : 'Në pritje'}</span></div>; }
