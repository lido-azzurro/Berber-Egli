export function normalizeAlbanianPhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');

  if (digits.startsWith('+355')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('355')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('00355')) {
    digits = '0' + digits.slice(5);
  }

  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  if (digits.startsWith('06')) {
    if (digits.length === 10) {
      return digits;
    }
    if (digits.length === 9) {
      return '0' + digits;
    }
  }

  return null;
}

export function isValidAlbanianPhone(raw: string): boolean {
  return normalizeAlbanianPhone(raw) !== null;
}

export function formatAlbanianPhone(raw: string): string {
  const normalized = normalizeAlbanianPhone(raw);
  if (!normalized) return raw;
  const rest = normalized.slice(2);
  const part1 = rest.slice(0, 3);
  const part2 = rest.slice(3, 6);
  const part3 = rest.slice(6);
  return `+355 6${part1} ${part2} ${part3}`;
}
