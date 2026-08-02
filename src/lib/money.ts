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

/**
 * Keep only digits and a single decimal separator (`.` or `,`) while typing.
 * Caps fractional digits at 2 so mobile/EU keyboards can enter cents.
 */
export function sanitizeMoneyInput(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return "";

  let separatorIndex = -1;
  let separator = "";
  let integer = "";
  let fraction = "";

  for (const char of cleaned) {
    if (char === "." || char === ",") {
      if (separatorIndex === -1) {
        separator = char;
        separatorIndex = integer.length;
      }
      continue;
    }
    if (separatorIndex === -1) {
      integer += char;
    } else if (fraction.length < 2) {
      fraction += char;
    }
  }

  if (separator) {
    return `${integer}${separator}${fraction}`;
  }
  return integer;
}

/** Normalize `,` / `.` decimal and optional thousands separators to a plain `123.45` string. */
export function normalizeMoneyDecimal(value: string): string {
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return "";

  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // European: 1.234,56
      return trimmed.replace(/\./g, "").replace(",", ".");
    }
    // US: 1,234.56
    return trimmed.replace(/,/g, "");
  }

  if (lastComma !== -1) {
    return trimmed.replace(",", ".");
  }

  return trimmed;
}

export function parseDollarsToCents(value: string): number | null {
  const normalized = normalizeMoneyDecimal(value);
  if (!normalized) return null;

  // Allow "10.", "10.5", ".5", and fully typed "10.50"
  const match = normalized.match(/^(\d*)(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  if (match[1] === "" && match[2] === undefined) return null;
  // Lone trailing separator with no digits yet (e.g. ".") is incomplete
  if (match[1] === "" && match[2] === "") return null;

  const dollars = match[1] === "" ? 0 : parseInt(match[1], 10);
  const centsPart = (match[2] ?? "").padEnd(2, "0").slice(0, 2);
  const cents = centsPart === "" ? 0 : parseInt(centsPart, 10);

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
