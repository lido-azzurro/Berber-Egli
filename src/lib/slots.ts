// Working hours for BERBER EGLI
// Morning:  09:00 - 15:00  (slots every 30 min: 09:00 ... 14:30)
// Break:    15:00 - 17:30  (disabled / grayed out)
// Evening:  17:30 - 22:00  (slots every 30 min: 17:30 ... 21:30)

function buildSlots(start: string, end: string): string[] {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const out: string[] = [];
  let h = sh;
  let m = sm;
  while (h < eh || (h === eh && m < em)) {
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
}

export const MORNING_SLOTS = buildSlots('09:00', '15:00');
export const EVENING_SLOTS = buildSlots('17:30', '22:00');

export const BREAK_SLOTS = buildSlots('15:00', '17:30');

export type SlotKind = 'morning' | 'break' | 'evening';

export type Slot = {
  time: string;
  kind: SlotKind;
};

export const ALL_SLOTS: Slot[] = [
  ...MORNING_SLOTS.map((time) => ({ time, kind: 'morning' as const })),
  ...BREAK_SLOTS.map((time) => ({ time, kind: 'break' as const })),
  ...EVENING_SLOTS.map((time) => ({ time, kind: 'evening' as const })),
];

export const WORKING_LABEL_AL = {
  morning: 'Mëngjes',
  break: 'Pushim',
  evening: 'Mbrëmje',
};
