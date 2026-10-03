// Working hours for BERBER EGLI
// Normal days:  Morning 09:00-14:30, Break 15:00-17:00 (with 17:00 as evening start), Evening 17:00-21:30
// Fridays:      Morning 09:00-12:30, Break 13:00-17:00, Evening 17:00-21:30

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

// Friday = day 5 (JavaScript getDay())
export function isFriday(dateISO: string): boolean {
  const d = new Date(dateISO + 'T00:00:00');
  return d.getDay() === 5;
}

export function getSlotsForDate(dateISO: string): Slot[] {
  const friday = isFriday(dateISO);
  const morningEnd = friday ? '12:30' : '14:30';
  const breakStart = friday ? '13:00' : '15:00';

  const morning = buildSlots('09:00', morningEnd);
  const breakSlots = buildSlots(breakStart, '17:00');
  const evening = buildSlots('17:00', '21:30');

  return [
    ...morning.map((time) => ({ time, kind: 'morning' as const })),
    ...breakSlots.map((time) => ({ time, kind: 'break' as const })),
    ...evening.map((time) => ({ time, kind: 'evening' as const })),
  ];
}

// Static defaults for backward compatibility (non-Friday)
export const MORNING_SLOTS = buildSlots('09:00', '14:30');
export const EVENING_SLOTS = buildSlots('17:00', '21:30');
export const BREAK_SLOTS = buildSlots('15:00', '17:00');

export type SlotKind = 'morning' | 'break' | 'evening';

export type Slot = {
  time: string;
  kind: SlotKind;
};

// Default slot list (non-Friday) used by admin modal and fallbacks
export const ALL_SLOTS: Slot[] = [
  ...MORNING_SLOTS.map((time) => ({ time, kind: 'morning' as const })),
  ...BREAK_SLOTS.map((time) => ({ time, kind: 'break' as const })),
  ...EVENING_SLOTS.map((time) => ({ time, kind: 'evening' as const })),
];

export function getSlotLabels(dateISO: string): { morning: string; break: string; evening: string } {
  if (isFriday(dateISO)) {
    return { morning: '09:00 — 12:30', break: '13:00 — 17:00', evening: '17:00 — 21:30' };
  }
  return { morning: '09:00 — 14:30', break: '15:00 — 17:00', evening: '17:00 — 21:30' };
}

export const WORKING_LABEL_AL = {
  morning: 'Mëngjes',
  break: 'Pushim',
  evening: 'Mbrëmje',
};

// The last regular evening slot — overtime slots start after this
export const LAST_EVENING_SLOT = '21:00';
export const OVERTIME_START_SLOT = '22:00';

export function buildOvertimeSlots(existingOvertime: string[]): string[] {
  const base = buildSlots('22:00', '23:30');
  return base.filter((t) => !existingOvertime.includes(t));
}
