import { useEffect, useState } from 'react';
import { ChevronLeft, Clock, User, Phone, FileText, Check, Loader2, AlertCircle, Calendar as CalIcon, Scissors, CheckCircle2 } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { ALL_SLOTS, WORKING_LABEL_AL, type SlotKind } from '@/lib/slots';
import { useBookedSlots } from '@/hooks/useBookings';
import { supabase, SERVICES, type ServiceType } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isSlotInPast } from '@/lib/timeFilter';
import { isValidAlbanianPhone, formatAlbanianPhone } from '@/lib/phone';

const MONTHS_AL = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
];

type Step = 'calendar' | 'slots' | 'service' | 'form' | 'confirm';

const STEP_ORDER: Step[] = ['calendar', 'slots', 'service', 'form'];

type Props = {
  onBack: () => void;
};

export default function BookingFlow({ onBack }: Props) {
  const [step, setStep] = useState<Step>('calendar');
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [extraSlots, setExtraSlots] = useState<string[]>([]);
  const { session, profile } = useAuth();
  const { bookedTimes, loading } = useBookedSlots(dateISO);

  // form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    if (!dateISO) { setExtraSlots([]); return; }
    void supabase.from('shop_extra_slots').select('slot_time').eq('slot_date', dateISO).then(({ data }) => {
      setExtraSlots((data as { slot_time: string }[] | null)?.map((row) => row.slot_time) ?? []);
    });
  }, [dateISO]);

  const totalPrice = selectedServices.reduce((sum, name) => {
    const svc = SERVICES.find((s) => s.name === name);
    return sum + (svc?.priceValue ?? 0);
  }, 0);

  const toggleService = (name: ServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleDateSelect = (iso: string) => {
    setDateISO(iso);
    setStep('slots');
  };

  const handleSlotSelect = (time: string) => {
    setSelectedTime(time);
    setStep('service');
  };

  const handlePhoneBlur = () => {
    if (phone && !isValidAlbanianPhone(phone)) {
      setPhoneError('Numri i telefonit nuk është i vlefshëm shqiptar.');
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateISO || !selectedTime) return;
    if (!fullName.trim() || !phone.trim()) {
      setError('Ju lutemi plotësoni emrin dhe numrin e telefonit.');
      return;
    }
    if (!isValidAlbanianPhone(phone)) {
      setError('Numri i telefonit nuk është i vlefshëm. Psh: +355 69 123 4567');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Zgjidh të paktën një shërbim.');
      setStep('service');
      return;
    }
    setSubmitting(true);
    setError(null);

    const primaryService = selectedServices[0];
    const serviceList = selectedServices.join(', ');
    const notesWithServices = notes.trim()
      ? `${serviceList}${notes.trim() ? ` — ${notes.trim()}` : ''}`
      : serviceList;

    const { error: insertError } = await supabase.from('bookings').insert({
      booking_date: dateISO,
      slot_time: selectedTime,
      client_full_name: fullName.trim(),
      client_phone: phone.trim(),
      notes: notesWithServices,
      source: 'online',
      service: primaryService,
      user_id: session?.user.id ?? null,
    });

    setSubmitting(false);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Ky orar është rezervuar tashmë. Ju lutemi zgjidhni një orë tjetër.');
        setStep('slots');
        return;
      }
      setError('Gabim gjatë rezervimit. Provoni përsëri.');
      return;
    }

    void triggerPushNotification(fullName.trim(), selectedTime, dateISO, serviceList);

    setStep('confirm');
  };

  const triggerPushNotification = async (clientName: string, slot: string, date: string, svc: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientName, slotTime: slot, bookingDate: date, service: svc }),
      });
    } catch {
      // push notification is best-effort; don't block booking confirmation
    }
  };

  const handleRestart = () => {
    setDateISO(null);
    setSelectedTime(null);
    setSelectedServices([]);
    setFullName('');
    setPhone('');
    setPhoneError(null);
    setNotes('');
    setError(null);
    setStep('calendar');
  };

  const formatDateAL = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${MONTHS_AL[d.getMonth()]} ${d.getFullYear()}`;
  };

  const goBack = () => {
    if (step === 'slots') setStep('calendar');
    else if (step === 'service') setStep('slots');
    else if (step === 'form') setStep('service');
    else onBack();
  };

  const renderSlots = (kind: SlotKind) => {
    const slots = ALL_SLOTS.filter((s) => s.kind === kind);
    if (slots.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold tracking-[0.2em] uppercase ${kind === 'break' ? 'text-neutral-600' : 'text-gold'}`}>
            {WORKING_LABEL_AL[kind]}
          </span>
          {kind === 'break' && (
            <span className="text-[10px] text-neutral-600">— Pushim</span>
          )}
          {kind === 'morning' && <span className="text-[10px] text-neutral-500">09:00 — 15:00</span>}
          {kind === 'evening' && <span className="text-[10px] text-neutral-500">17:30 — 22:00</span>}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isBreak = slot.kind === 'break';
            const isBooked = bookedTimes.has(slot.time);
            const isPast = dateISO ? isSlotInPast(dateISO, slot.time) : false;
            const disabled = isBreak || isBooked || isPast || loading;
            return (
              <button
                key={slot.time}
                onClick={() => !disabled && handleSlotSelect(slot.time)}
                disabled={disabled}
                className={`
                  py-3 rounded-xl text-sm font-medium transition-all border
                  ${isBreak
                    ? 'bg-[#0d0d0d] border-[#1a1a1a] text-neutral-700 cursor-not-allowed'
                    : isBooked
                      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-600 cursor-not-allowed line-through'
                      : isPast
                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-600 cursor-not-allowed line-through opacity-50'
                        : 'bg-[#1c1c1c] border-[#2a2a2a] text-neutral-200 hover:border-[#d4af37] hover:text-gold active:scale-95'
                  }
                `}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 py-6 sm:py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#1c1c1c] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-2xl text-white tracking-wide">
            {step === 'calendar' && 'REZERVO TAKIM'}
            {step === 'slots' && 'ZGJIDH ORËN'}
            {step === 'service' && 'ZGJIDH SHËRBIMIN'}
            {step === 'form' && 'TË DHËNAT'}
            {step === 'confirm' && 'KONFIRMUAR'}
          </h2>
        </div>

        {/* Progress indicator */}
        {step !== 'confirm' && (
          <div className="flex items-center gap-2 mb-8">
            {STEP_ORDER.map((s, i) => {
              const currentIdx = STEP_ORDER.indexOf(step);
              const active = i <= currentIdx;
              return (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${active ? 'bg-[#d4af37]' : 'bg-[#2a2a2a]'}`} />
              );
            })}
          </div>
        )}

        {/* Step: Calendar */}
        {step === 'calendar' && (
          <div className="animate-fade-in">
            <CalendarPicker onDateSelect={handleDateSelect} onClose={onBack} />
          </div>
        )}

        {/* Step: Slots */}
        {step === 'slots' && dateISO && (
          <div className="animate-fade-in">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 mb-5 flex items-center gap-3">
              <CalIcon className="w-5 h-5 text-gold shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Data e zgjedhur</p>
                <p className="text-white font-medium">{formatDateAL(dateISO)}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-neutral-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Po ngarkohen oraret...</span>
              </div>
            ) : (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                {renderSlots('morning')}
                {renderSlots('break')}
                {renderSlots('evening')}
                {extraSlots.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3"><span className="text-xs font-semibold tracking-[0.2em] uppercase text-gold">Orar shtesë</span><span className="text-[10px] text-neutral-500">Sipas kërkesës së berberit</span></div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{extraSlots.map((time) => { const isBooked = bookedTimes.has(time); const isPast = dateISO ? isSlotInPast(dateISO, time) : false; const disabled = isBooked || isPast; return <button key={time} onClick={() => !disabled && handleSlotSelect(time)} disabled={disabled} className={`py-3 rounded-xl text-sm font-medium border ${isBooked ? 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-600 line-through' : isPast ? 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-600 line-through opacity-50' : 'bg-[#1c1c1c] border-[#2a2a2a] text-neutral-200 hover:border-[#d4af37] hover:text-gold'}`}>{time}</button>; })}</div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
              <span className="inline-block w-3 h-3 rounded bg-[#1a1a1a] border border-[#2a2a2a]" />
              I rezervuar
              <span className="inline-block w-3 h-3 rounded bg-[#0d0d0d] border border-[#1a1a1a] ml-3" />
              Pushim
              <span className="inline-block w-3 h-3 rounded bg-[#1a1a1a] border border-[#2a2a2a] opacity-50 ml-3" />
              Kaluar
            </p>
          </div>
        )}

        {/* Step: Service — Multiple selection with checkboxes */}
        {step === 'service' && (
          <div className="animate-fade-in">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 mb-5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-gold shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">{dateISO && formatDateAL(dateISO)} · Ora {selectedTime}</p>
              </div>
            </div>

            <p className="text-sm text-neutral-400 mb-4">Zgjidh një ose disa shërbime. Mund të bashkoni sa të dëshironi.</p>

            <div className="space-y-3">
              {SERVICES.map((s) => {
                const checked = selectedServices.includes(s.name);
                return (
                  <button
                    key={s.name}
                    onClick={() => toggleService(s.name)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left active:scale-[0.98] ${
                      checked
                        ? 'border-[#d4af37] bg-[#d4af37]/5 gold-glow'
                        : 'border-[#2a2a2a] bg-[#141414] hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-all ${checked ? 'bg-[#d4af37] border-[#d4af37]' : 'border-[#3a3a3a]'}`}>
                      {checked && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{s.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Kliko për të zgjedh</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-display text-xl tracking-wide">{s.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Total + Next button */}
            {selectedServices.length > 0 && (
              <div className="mt-5 bg-[#141414] border border-[#d4af37]/30 rounded-2xl p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-neutral-500">{selectedServices.length} shërbim{selectedServices.length > 1 ? 'e' : ''} selected</p>
                    <p className="text-white text-sm mt-1">{selectedServices.join(' + ')}</p>
                  </div>
                  <p className="text-gold font-display text-2xl tracking-wide">{totalPrice} ALL</p>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="w-full bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-3.5 rounded-xl transition-all duration-300 gold-glow active:scale-95 flex items-center justify-center gap-2"
                >
                  Vazhdo
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <p className="text-xs text-neutral-500">{dateISO && formatDateAL(dateISO)}</p>
                  <p className="text-white font-medium text-sm">Ora {selectedTime} · {selectedServices.join(', ')}</p>
                  <p className="text-gold text-xs mt-0.5">Totali: {totalPrice} ALL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('service')}
                className="text-xs text-gold hover:underline"
              >
                Ndrysho
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-5">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  <User className="w-4 h-4 text-gold" />
                  Emër Mbiemër
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Shkruani emrin dhe mbiemrin"
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
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                  onBlur={handlePhoneBlur}
                  placeholder="+355 6X XXX XXXX"
                  className={`w-full bg-[#0a0a0a] border rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                    phoneError ? 'border-red-500/50 focus:border-red-500' : 'border-[#2a2a2a] focus:border-[#d4af37]'
                  }`}
                  required
                />
                {phoneError && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {phoneError}
                  </p>
                )}
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
                  placeholder="Çdo kërkesë specifike..."
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-4 rounded-xl transition-all duration-300 gold-glow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Po konfirmohet...
                  </>
                ) : (
                  `Konfirmo Rezervimin — ${totalPrice} ALL`
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step: Confirmation */}
        {step === 'confirm' && dateISO && selectedTime && (
          <div className="animate-scale-in flex flex-col items-center text-center pt-6">
            <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 flex items-center justify-center mb-6 animate-pulse-gold">
              <Check className="w-10 h-10 text-gold" strokeWidth={3} />
            </div>
            <h3 className="font-display text-3xl text-white tracking-wide mb-2">REZERVIMI U KONFIRMUA!</h3>
            <p className="text-neutral-400 text-sm mb-8">Takimi juaj është caktuar me sukses.</p>

            <div className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 text-left space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500">Data</span>
                <span className="text-white font-medium">{formatDateAL(dateISO)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500">Ora</span>
                <span className="text-gold font-display text-xl tracking-wide">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-start pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500 shrink-0">Shërbimi</span>
                <span className="text-white font-medium text-right">{selectedServices.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500">Totali</span>
                <span className="text-gold font-display text-xl tracking-wide">{totalPrice} ALL</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500">Emri</span>
                <span className="text-white font-medium">{fullName}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm text-neutral-500">Telefoni</span>
                <span className="text-white font-medium">{phone}</span>
              </div>
              {notes && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-neutral-500 shrink-0">Shënime</span>
                  <span className="text-white text-sm text-right max-w-[60%]">{notes}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-600 mt-6">
              Ju lutemi prezantohuni 5 minuta përpara. Për anulim, telefononi në +355 69 536 7019.
            </p>

            <div className="flex gap-3 mt-8 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                Rezervo tjetër
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-3.5 rounded-xl transition-colors"
              >
                Kreu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
