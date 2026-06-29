export const PAYMENT_METHODS = ["Cash", "Bank transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "Cash";

export function buildPaymentNote(
  method: PaymentMethod,
  extraNote?: string,
): string {
  const extra = extraNote?.trim();
  if (!extra) return method;
  return `${method} - ${extra}`;
}

export function parsePaymentNote(note: string | null | undefined): {
  method: PaymentMethod;
  extraNote: string;
} {
  if (!note) {
    return { method: DEFAULT_PAYMENT_METHOD, extraNote: "" };
  }

  for (const method of PAYMENT_METHODS) {
    if (note === method) {
      return { method, extraNote: "" };
    }
    const prefix = `${method} - `;
    if (note.startsWith(prefix)) {
      return { method, extraNote: note.slice(prefix.length) };
    }
  }

  return { method: DEFAULT_PAYMENT_METHOD, extraNote: note };
}
