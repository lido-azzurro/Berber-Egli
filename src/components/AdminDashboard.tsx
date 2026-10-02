import { useState, useMemo, useEffect } from 'react';
import {
  Scissors, LogOut, Bell, Plus, Trash2, X, Calendar as CalIcon,
  Clock, Phone, User, FileText, Loader2, CalendarDays, TrendingUp,
  CheckCircle2, Circle, Filter, Settings, ShieldCheck, CalendarPlus, KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAllBookings, useNewBookingsCount } from '@/hooks/useBookings';
import { ALL_SLOTS } from '@/lib/slots';
import { supabase, SERVICES, type Booking, type ServiceType, type BookingStatus, type Profile } from '@/lib/supabase';
import CalendarPicker from './CalendarPicker';

const MONTHS_AL = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
];

function formatDateAL(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_AL[d.getMonth()]} ${d.getFullYear()}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  pending: { label: 'Në pritje', color: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
  completed: { label: 'Përfunduar', color: 'bg-green-500/15 text-green-400', dot: 'bg-green-400' },
  cancelled: { label: 'Anuluar', color: 'bg-red-500/15 text-red-400', dot: 'bg-red-400' },
};

type Props = {
  onBackHome: () => void;
};

export default function AdminDashboard({ onBackHome }: Props) {
  const { signOut, session, profile, updatePassword, refreshProfile } = useAuth();
  const { bookings, loading, refresh } = useAllBookings();
  const newCount = useNewBookingsCount();

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [view, setView] = useState<'today' | 'all' | 'past' | 'date'>('today');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const today = todayISO();
  const todaysBookings = useMemo(() => bookings.filter((b) => b.booking_date === today), [bookings, today]);
  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.booking_date >= today && b.status !== 'cancelled').sort((a, b) =>
      a.booking_date === b.booking_date ? a.slot_time.localeCompare(b.slot_time) : a.booking_date.localeCompare(b.booking_date)
    ),
    [bookings, today]
  );
  const pastBookings = useMemo(
    () => bookings.filter((b) => b.booking_date < today).sort((a, b) =>
      a.booking_date === b.booking_date ? b.slot_time.localeCompare(a.slot_time) : b.booking_date.localeCompare(a.booking_date)
    ),
    [bookings, today]
  );
  const dateFilteredBookings = useMemo(
    () => bookings.filter((b) => b.booking_date === filterDate).sort((a, b) => a.slot_time.localeCompare(b.slot_time)),
    [bookings, filterDate]
  );

  const markAllSeen = async () => {
    await supabase.from('bookings').update({ seen_by_admin: true }).eq('seen_by_admin', false);
    refresh();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('bookings').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  const handleStatusChange = async (booking: Booking, status: BookingStatus) => {
    await supabase.from('bookings').update({ status }).eq('id', booking.id);
    refresh();
  };

  const visibleBookings =
    view === 'today' ? todaysBookings
    : view === 'all' ? upcomingBookings
    : view === 'past' ? pastBookings
    : dateFilteredBookings;

  const tabs: { key: typeof view; label: string }[] = [
    { key: 'today', label: 'Sot' },
    { key: 'all', label: 'Të ardhshme' },
    { key: 'past', label: 'Të kaluara' },
    { key: 'date', label: 'Filter data' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold" />
            <span className="font-display text-xl text-white tracking-wider hidden sm:inline">BERBER EGLI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllSeen}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-[#1c1c1c] transition-colors"
              title="Shëno si të lexuara"
            >
              <Bell className="w-5 h-5" />
              {newCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-[#d4af37] text-black text-[11px] font-bold flex items-center justify-center animate-pulse-gold">
                  {newCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#e8c656] text-black text-sm font-bold px-4 py-2.5 rounded-xl transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Shto</span>
            </button>

            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-[#1c1c1c] transition-colors" title="Cilësimet">
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => { signOut(); onBackHome(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-[#1c1c1c] transition-colors"
              title="Dil"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
            <CalendarDays className="w-5 h-5 text-gold mb-2" />
            <p className="font-display text-2xl text-white">{todaysBookings.length}</p>
            <p className="text-[11px] text-neutral-500">Sot</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
            <TrendingUp className="w-5 h-5 text-gold mb-2" />
            <p className="font-display text-2xl text-white">{upcomingBookings.length}</p>
            <p className="text-[11px] text-neutral-500">Të ardhshme</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
            <Bell className="w-5 h-5 text-gold mb-2" />
            <p className="font-display text-2xl text-white">{newCount}</p>
            <p className="text-[11px] text-neutral-500">Të reja</p>
          </div>
        </div>

        {/* New bookings alert */}
        {newCount > 0 && (
          <div className="flex items-center justify-between bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl px-4 py-3 mb-5 animate-fade-in">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold-bright">
                +{newCount} Rezervim{newCount > 1 ? 'e' : ''} i ri{newCount > 1 ? '' : ''}!
              </span>
            </div>
            <button onClick={markAllSeen} className="text-xs text-gold hover:underline">Shëno si të lexuara</button>
          </div>
        )}

        {/* View tabs */}
        <div className="flex gap-2 mb-5 p-1 bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setView(tab.key);
                if (tab.key === 'date') setShowDatePicker(true);
              }}
              className={`flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                view === tab.key ? 'bg-[#d4af37] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date filter picker */}
        {view === 'date' && showDatePicker && (
          <div className="mb-5 animate-fade-in">
            <CalendarPicker
              onDateSelect={(iso) => { setFilterDate(iso); setShowDatePicker(false); }}
              onClose={() => setShowDatePicker(false)}
            />
          </div>
        )}

        {/* Date filter summary */}
        {view === 'date' && filterDate && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gold" />
              <span className="text-sm text-white">{formatDateAL(filterDate)}</span>
            </div>
            <button onClick={() => setShowDatePicker(true)} className="text-xs text-gold hover:underline">Ndrysho datën</button>
          </div>
        )}

        {/* Bookings list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Po ngarkohen rezervimet...</span>
          </div>
        ) : view === 'date' && !filterDate ? (
          <div className="text-center py-16 text-neutral-600">
            <CalIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Zgjidh një datë për të filtruar.</p>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <CalIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nuk ka rezervime për të shfaqur.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBookings.map((b, idx) => (
              <BookingCard
                key={b.id}
                booking={b}
                isNew={!b.seen_by_admin}
                index={idx}
                onDelete={() => setConfirmDelete(b)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add modal */}
      {showAddModal && (
        <AddBookingModal onClose={() => setShowAddModal(false)} onDone={() => { setShowAddModal(false); refresh(); }} />
      )}

      {showSettings && session && profile && (
        <AdminSettings
          sessionId={session.user.id}
          profile={profile}
          updatePassword={updatePassword}
          refreshProfile={refreshProfile}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-5 animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display text-xl text-white">Anulo rezervimin?</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              Rezervimi për <span className="text-white font-medium">{confirmDelete.client_full_name}</span> në datën {formatDateAL(confirmDelete.booking_date)} ora {confirmDelete.slot_time} do të fshihet përgjithmonë.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white font-medium py-3 rounded-xl transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500/90 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Fshi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking, isNew, index, onDelete, onStatusChange,
}: {
  booking: Booking;
  isNew: boolean;
  index: number;
  onDelete: () => void;
  onStatusChange: (booking: Booking, status: BookingStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[booking.status];

  return (
    <div
      className={`bg-[#141414] border rounded-2xl overflow-hidden transition-all animate-fade-in-up ${
        isNew ? 'border-[#d4af37]/40' : 'border-[#2a2a2a]'
      } ${booking.status === 'cancelled' ? 'opacity-60' : ''}`}
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Time badge */}
        <div className={`shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isNew ? 'bg-[#d4af37]/10' : 'bg-[#1c1c1c]'}`}>
          <span className={`font-display text-lg leading-none ${isNew ? 'text-gold' : 'text-white'}`}>{booking.slot_time}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{booking.client_full_name}</p>
          <p className="text-xs text-neutral-500">{formatDateAL(booking.booking_date)}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {booking.service && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-gold uppercase tracking-wider">
                {booking.service}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
              booking.source === 'online' ? 'bg-blue-500/15 text-blue-400' :
              booking.source === 'walkin' ? 'bg-green-500/15 text-green-400' :
              'bg-purple-500/15 text-purple-400'
            }`}>
              {booking.source === 'online' ? 'Online' : booking.source === 'walkin' ? 'Walk-in' : 'Telefon'}
            </span>
            {isNew && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-bold uppercase tracking-wider animate-pulse-gold">
                E re
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a] mt-1 space-y-3 animate-fade-in">
          {/* Service */}
          {booking.service && (
            <div className="flex items-center gap-3 text-sm pt-3">
              <Scissors className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="text-neutral-300">{booking.service}</span>
            </div>
          )}
          {/* Phone */}
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
            <a href={`tel:${booking.client_phone}`} className="text-gold hover:underline">{booking.client_phone}</a>
          </div>
          {/* Notes */}
          <div className="flex items-start gap-3 text-sm">
            <FileText className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <span className="text-neutral-300">{booking.notes || 'Pa shënime'}</span>
          </div>

          <ClientHistory booking={booking} />

          {/* Status actions */}
          <div className="flex gap-2 pt-2">
            {booking.status !== 'completed' && (
              <button
                onClick={() => onStatusChange(booking, 'completed')}
                className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 px-3 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Shëno të përfunduar
              </button>
            )}
            {booking.status !== 'pending' && booking.status !== 'cancelled' && (
              <button
                onClick={() => onStatusChange(booking, 'pending')}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-lg transition-colors"
              >
                <Circle className="w-4 h-4" />
                Rikthe në pritje
              </button>
            )}
            {booking.status !== 'cancelled' && (
              <button
                onClick={() => onStatusChange(booking, 'cancelled')}
                className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Anulo
              </button>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors pt-1"
          >
            <Trash2 className="w-4 h-4" />
            Fshi rezervimin
          </button>
        </div>
      )}
    </div>
  );
}

function ClientHistory({ booking }: { booking: Booking }) {
  const [client, setClient] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Booking[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!booking.user_id) return;
    void Promise.all([
      supabase.from('profiles').select('*').eq('id', booking.user_id).maybeSingle(),
      supabase.from('bookings').select('*').eq('user_id', booking.user_id).order('booking_date', { ascending: false }).order('slot_time', { ascending: false }),
    ]).then(([profileResult, bookingsResult]) => {
      const nextClient = profileResult.data as Profile | null;
      setClient(nextClient);
      setNotes(nextClient?.barber_notes ?? '');
      setHistory((bookingsResult.data as Booking[]) ?? []);
    });
  }, [booking.user_id]);

  if (!booking.user_id) {
    return <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-3 text-xs text-neutral-500">Rezervim si vizitor. Nuk ka histori llogarie.</div>;
  }

  const completed = history.filter((item) => item.status === 'completed').length;
  const saveNotes = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ barber_notes: notes.trim() || null }).eq('id', booking.user_id);
    setSaving(false);
  };

  return <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-4 space-y-4">
    <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.18em] text-gold">Profili i klientit</p>{completed === 0 && <a href={`tel:${booking.client_phone}`} className="text-xs font-bold text-green-400 hover:underline">Telefono klientin</a>}</div>
    <div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-neutral-600">Llogaria krijuar</p><p className="text-neutral-300 mt-1">{client ? formatDateAL(client.created_at.slice(0, 10)) : 'Po ngarkohet...'}</p></div><div><p className="text-neutral-600">Rezervime të përfunduara</p><p className="text-white mt-1">{completed}</p></div></div>
    <div><p className="text-neutral-600 text-xs mb-2">Historia e plotë</p><div className="space-y-1 max-h-28 overflow-y-auto">{history.length === 0 ? <p className="text-xs text-neutral-600">Pa histori.</p> : history.map((item) => <div key={item.id} className="flex justify-between text-xs"><span className="text-neutral-400">{formatDateAL(item.booking_date)}</span><span className="text-neutral-300">{item.slot_time} · {item.service ?? 'Qethje'}</span></div>)}</div></div>
    <div><p className="text-neutral-600 text-xs mb-2">Shënime private të berberit</p><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Preferenca, korrektësia, kujdesi..." className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] focus:outline-none resize-none" /><button onClick={saveNotes} disabled={saving} className="mt-2 text-xs text-gold hover:underline">{saving ? 'Po ruhet...' : 'Ruaj shënimin'}</button></div>
  </div>;
}

function AdminSettings({ sessionId, profile, updatePassword, refreshProfile, onClose }: { sessionId: string; profile: Profile; updatePassword: (password: string) => Promise<{ error: string | null }>; refreshProfile: () => Promise<Profile | null>; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [backupEmail, setBackupEmail] = useState(profile.backup_email ?? 'erjolibi@gmail.com');
  const [offDate, setOffDate] = useState('');
  const [offReason, setOffReason] = useState('');
  const [extraDate, setExtraDate] = useState('');
  const [extraTime, setExtraTime] = useState('');
  const [daysOff, setDaysOff] = useState<{ id: string; off_date: string; reason: string | null }[]>([]);
  const [extraSlots, setExtraSlots] = useState<{ id: string; slot_date: string; slot_time: string }[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    const [days, slots] = await Promise.all([
      supabase.from('shop_days_off').select('id, off_date, reason').order('off_date'),
      supabase.from('shop_extra_slots').select('id, slot_date, slot_time').order('slot_date').order('slot_time'),
    ]);
    setDaysOff((days.data as typeof daysOff) ?? []);
    setExtraSlots((slots.data as typeof extraSlots) ?? []);
  };
  useEffect(() => { void loadSettings(); }, []);

  const verifyCurrentPassword = async () => {
    const email = 'berberegli@gmail.com';
    const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    return !error;
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!(await verifyCurrentPassword())) { setMessage('Fjalëkalimi aktual nuk është i saktë.'); return; }
    const result = await updatePassword(newPassword);
    setMessage(result.error ?? 'Fjalëkalimi u ndryshua me sukses.');
    if (!result.error) setNewPassword('');
  };

  const requestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim()) return;
    if (!(await verifyCurrentPassword())) { setMessage('Fjalëkalimi aktual nuk është i saktë.'); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setMessage(error ? 'Emaili nuk mund të ndryshohej.' : 'Emaili i ri u regjistrua. Konfirmojeni nga lidhja që do të merrni.');
  };

  const saveBackupEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await supabase.from('profiles').update({ backup_email: backupEmail.trim() }).eq('id', sessionId);
    if (!error) { await refreshProfile(); setMessage('Emaili rezervë u ruajt.'); }
  };

  const addDayOff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!offDate) return;
    const { error } = await supabase.from('shop_days_off').insert({ off_date: offDate, reason: offReason.trim() || null });
    setMessage(error ? 'Kjo ditë është tashmë e bllokuar.' : 'Dita e pushimit u shtua.');
    if (!error) { setOffDate(''); setOffReason(''); await loadSettings(); }
  };

  const addExtraSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!extraDate || !extraTime) return;
    const { error } = await supabase.from('shop_extra_slots').insert({ slot_date: extraDate, slot_time: extraTime });
    setMessage(error ? 'Ky orar shtesë ekziston.' : 'Orari shtesë u shtua.');
    if (!error) { setExtraDate(''); setExtraTime(''); await loadSettings(); }
  };

  const removeDayOff = async (id: string) => { await supabase.from('shop_days_off').delete().eq('id', id); await loadSettings(); };
  const removeExtraSlot = async (id: string) => { await supabase.from('shop_extra_slots').delete().eq('id', id); await loadSettings(); };

  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-5" onClick={onClose}><div className="bg-[#141414] border border-[#2a2a2a] rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-hide" onClick={(event) => event.stopPropagation()}>
    <div className="sticky top-0 z-10 bg-[#141414] border-b border-[#2a2a2a] px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-gold" /><h2 className="font-display text-2xl text-white">CILËSIMET</h2></div><button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button></div>
    <div className="p-5 space-y-5">
      <section className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 space-y-4"><h3 className="font-display text-xl text-white">SIGURIA E ADMINIT</h3><p className="text-xs text-neutral-500">Email primar: <span className="text-white">{profile.id ? 'berberegli@gmail.com' : '—'}</span></p><input type="password" minLength={6} required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Fjalëkalimi aktual" className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none" /><form onSubmit={savePassword} className="flex gap-2"><input type="password" minLength={6} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Fjalëkalim i ri" className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none" /><button className="bg-[#d4af37] text-black font-bold px-4 rounded-xl flex items-center gap-2"><KeyRound className="w-4 h-4" />Ndrysho</button></form><form onSubmit={saveBackupEmail} className="flex gap-2"><input type="email" required value={backupEmail} onChange={(event) => setBackupEmail(event.target.value)} className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none" /><button className="bg-[#1c1c1c] text-white px-4 rounded-xl">Ruaj rezervë</button></form><form onSubmit={requestEmailChange} className="flex gap-2"><input type="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Email i ri primar" className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none" /><button className="bg-[#1c1c1c] text-white px-4 rounded-xl">Kërko ndryshim</button></form></section>
      <section className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 space-y-4"><h3 className="font-display text-xl text-white">DITË PUSHIMI SHTESË</h3><form onSubmit={addDayOff} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"><input type="date" value={offDate} onChange={(event) => setOffDate(event.target.value)} required className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white" /><input value={offReason} onChange={(event) => setOffReason(event.target.value)} placeholder="Arsyeja (opsionale)" className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white" /><button className="bg-[#d4af37] text-black font-bold px-4 rounded-xl flex items-center justify-center gap-2"><CalendarPlus className="w-4 h-4" />Shto</button></form><div className="space-y-2">{daysOff.map((day) => <div key={day.id} className="flex justify-between text-sm"><span className="text-neutral-300">{formatDateAL(day.off_date)} {day.reason && `· ${day.reason}`}</span><button onClick={() => void removeDayOff(day.id)} className="text-red-400 hover:underline">Hiq</button></div>)}</div></section>
      <section className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-4 space-y-4"><h3 className="font-display text-xl text-white">ORARE SHTESË</h3><form onSubmit={addExtraSlot} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"><input type="date" value={extraDate} onChange={(event) => setExtraDate(event.target.value)} required className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white" /><input type="time" value={extraTime} onChange={(event) => setExtraTime(event.target.value)} required className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white" /><button className="bg-[#d4af37] text-black font-bold px-4 rounded-xl">Shto</button></form><div className="space-y-2">{extraSlots.map((slot) => <div key={slot.id} className="flex justify-between text-sm"><span className="text-neutral-300">{formatDateAL(slot.slot_date)} · {slot.slot_time}</span><button onClick={() => void removeExtraSlot(slot.id)} className="text-red-400 hover:underline">Hiq</button></div>)}</div></section>
      {message && <p className="text-sm text-gold">{message}</p>}
    </div>
  </div></div>;
}

function AddBookingModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'date' | 'details'>('date');
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [service, setService] = useState<ServiceType>('Qethje');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'walkin' | 'phone'>('walkin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());

  const handleDateSelect = async (iso: string) => {
    setDateISO(iso);
    setStep('details');
    const { data } = await supabase.from('bookings').select('slot_time').eq('booking_date', iso);
    const set = new Set<string>();
    if (data) for (const row of data as { slot_time: string }[]) set.add(row.slot_time);
    setBookedSet(set);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateISO || !slotTime || !fullName.trim() || !phone.trim()) {
      setError('Plotësoni të gjitha fushat e detyrueshme.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('bookings').insert({
      booking_date: dateISO,
      slot_time: slotTime,
      client_full_name: fullName.trim(),
      client_phone: phone.trim(),
      notes: notes.trim() || null,
      source,
      service,
      seen_by_admin: true,
    });
    setSubmitting(false);
    if (insertError) {
      if (insertError.code === '23505') {
        setError('Ky orar është i zënë tashmë.');
        return;
      }
      setError('Gabim. Provoni përsëri.');
      return;
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-5 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-display text-xl text-white tracking-wide">SHTO REZERVIM</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-[#2a2a2a] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'date' ? (
            <CalendarPicker onDateSelect={handleDateSelect} onClose={onClose} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date + slot summary */}
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Data</p>
                <p className="text-white font-medium mb-3">{dateISO && formatDateAL(dateISO)}</p>

                <p className="text-xs text-neutral-500 mb-2">Zgjidh orën</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_SLOTS.filter((s) => s.kind !== 'break').map((s) => {
                    const booked = bookedSet.has(s.time);
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={booked}
                        onClick={() => setSlotTime(s.time)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                          slotTime === s.time
                            ? 'bg-[#d4af37] text-black border-[#d4af37]'
                            : booked
                              ? 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-700 cursor-not-allowed line-through'
                              : 'bg-[#1c1c1c] border-[#2a2a2a] text-neutral-200 hover:border-[#d4af37]'
                        }`}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service */}
              <div>
                <p className="text-sm font-medium text-neutral-300 mb-2">Shërbimi</p>
                <div className="space-y-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setService(s.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors border ${
                        service === s.name
                          ? 'bg-[#d4af37]/10 border-[#d4af37] text-gold'
                          : 'bg-[#1c1c1c] border-[#2a2a2a] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-xs">{s.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div>
                <p className="text-sm font-medium text-neutral-300 mb-2">Burimi</p>
                <div className="flex gap-2">
                  {([
                    { key: 'walkin', label: 'Walk-in' },
                    { key: 'phone', label: 'Telefon' },
                  ] as const).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSource(s.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        source === s.key ? 'bg-[#d4af37] text-black' : 'bg-[#1c1c1c] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  <User className="w-4 h-4 text-gold" />
                  Emër Mbiemër
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Emri i klientit"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  <Phone className="w-4 h-4 text-gold" />
                  Numër Telefoni
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+355 6X XXX XXXX"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Shënime (opsionale)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  <X className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Shto Rezervim'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
