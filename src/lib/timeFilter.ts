export function isSlotInPast(dateISO: string, slotTime: string): boolean {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dateISO > todayISO) return false;
  if (dateISO < todayISO) return true;

  const [slotH, slotM] = slotTime.split(':').map(Number);
  const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotH, slotM);
  const diffMs = slotDate.getTime() - now.getTime();
  return diffMs < 10 * 60 * 1000;
}
