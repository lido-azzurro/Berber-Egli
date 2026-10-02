import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MONTHS_AL = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
const WEEKDAYS_AL = ['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'];

type Props = { onDateSelect: (dateISO: string) => void; onClose: () => void };

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPicker({ onDateSelect, onClose }: Props) {
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [customDaysOff, setCustomDaysOff] = useState<Set<string>>(new Set());

  useEffect(() => {
    void supabase.from('shop_days_off').select('off_date').then(({ data }) => {
      setCustomDaysOff(new Set((data as { off_date: string }[] | null)?.map((row) => row.off_date) ?? []));
    });
  }, []);

  const firstDayOfMonth = useMemo(() => { const jsDay = new Date(viewYear, viewMonth, 1).getDay(); return jsDay === 0 ? 6 : jsDay - 1; }, [viewYear, viewMonth]);
  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const canGoPrev = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  const isPastDay = (day: number) => new Date(viewYear, viewMonth, day) < today;
  const isWednesday = (day: number) => new Date(viewYear, viewMonth, day).getDay() === 3;
  const isCustomDayOff = (day: number) => customDaysOff.has(toISO(new Date(viewYear, viewMonth, day)));
  const isDayOff = (day: number) => isWednesday(day) || isCustomDayOff(day);

  const handleDayClick = (day: number) => {
    if (isPastDay(day) || isDayOff(day)) return;
    const iso = toISO(new Date(viewYear, viewMonth, day));
    setSelectedISO(iso);
    onDateSelect(iso);
  };

  const moveMonth = (direction: number) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 sm:p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><CalIcon className="w-5 h-5 text-gold" /><h3 className="font-display text-2xl text-white tracking-wide">ZGJIDH DATËN</h3></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => moveMonth(-1)} disabled={!canGoPrev} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-[#2a2a2a] disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
        <h4 className="font-display text-xl text-white tracking-wide">{MONTHS_AL[viewMonth]} {viewYear}</h4>
        <button onClick={() => moveMonth(1)} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-[#2a2a2a]"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS_AL.map((day) => <div key={day} className="text-center text-[9px] font-medium text-neutral-500 py-2 leading-tight">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(new Date(viewYear, viewMonth, day));
          const past = isPastDay(day);
          const dayOff = isDayOff(day);
          const selected = selectedISO === iso;
          const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
          return <button key={day} onClick={() => handleDayClick(day)} disabled={past || dayOff} title={dayOff ? 'Ditë pushimi' : undefined} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${selected ? 'bg-[#d4af37] text-black font-bold gold-glow' : dayOff ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed' : past ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-300 hover:bg-[#2a2a2a] hover:text-white'} ${isToday && !selected && !dayOff ? 'ring-1 ring-[#d4af37]/50' : ''}`}>{day}</button>;
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />Ngjyra e Kuqe = Ditë Pushimi</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#d4af37]" />Data e zgjedhur</span>
      </div>
    </div>
  );
}
