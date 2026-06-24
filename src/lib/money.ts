export function splitByShares(
  totalCents: number,
  entries: { userId: string; shares: number }[],
): { userId: string; amountOwed: number }[] {
  if (entries.length === 0) return [];

  const totalShares = entries.reduce((sum, e) => sum + e.shares, 0);
  if (totalShares === 0) return [];

  let allocated = 0;
  return entries.map((entry, index) => {
    if (index === entries.length - 1) {
      return { userId: entry.userId, amountOwed: totalCents - allocated };
    }
    const amount = Math.floor((totalCents * entry.shares) / totalShares);
    allocated += amount;
    return { userId: entry.userId, amountOwed: amount };
  });
}

export function formatCents(cents: number, symbol = "$"): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = Math.floor(absCents / 100);
  const remainder = absCents % 100;
  const formatted = `${symbol}${dollars}.${remainder.toString().padStart(2, "0")}`;
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

export function splitEqually(
  totalCents: number,
  userIds: string[],
): { userId: string; amountOwed: number }[] {
  if (userIds.length === 0) return [];

  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents % userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amountOwed: base + (index < remainder ? 1 : 0),
  }));
}

export function splitByPercentages(
  totalCents: number,
  entries: { userId: string; percentage: number }[],
): { userId: string; amountOwed: number }[] {
  if (entries.length === 0) return [];

  const totalPct = entries.reduce((sum, e) => sum + e.percentage, 0);
  if (totalPct !== 100) return [];

  let allocated = 0;
  const result = entries.map((entry, index) => {
    if (index === entries.length - 1) {
      return { userId: entry.userId, amountOwed: totalCents - allocated };
    }
    const amount = Math.floor((totalCents * entry.percentage) / 100);
    allocated += amount;
    return { userId: entry.userId, amountOwed: amount };
  });

  return result;
}
