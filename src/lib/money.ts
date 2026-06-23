export function formatCents(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = Math.floor(absCents / 100);
  const remainder = absCents % 100;
  const formatted = `$${dollars}.${remainder.toString().padStart(2, "0")}`;
  return isNegative ? `-${formatted}` : formatted;
}

export function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+)(?:\.(\d{0,2}))?$/);
  if (!match) return null;

  const dollars = parseInt(match[1], 10);
  const centsPart = (match[2] ?? "").padEnd(2, "0").slice(0, 2);
  const cents = parseInt(centsPart, 10);

  if (Number.isNaN(dollars) || Number.isNaN(cents)) return null;
  return dollars * 100 + cents;
}

export function splitEqually(totalCents: number, userIds: string[]): { userId: string; amountOwed: number }[] {
  if (userIds.length === 0) return [];

  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents % userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amountOwed: base + (index < remainder ? 1 : 0),
  }));
}
