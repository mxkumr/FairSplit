import { formatCents } from "@/lib/money";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type BalanceExplanationLine = {
  kind: "borrowed" | "lent" | "payment_out" | "payment_in";
  expenseId?: string;
  paymentId?: string;
  counterparty: UserSummary;
  amount: number;
  /** Signed effect on this user's net balance (positive = owed money, negative = owes money) */
  netEffect: number;
  text: string;
  sortDate: string;
};

type ExpenseInput = {
  id: string;
  description: string;
  expenseDate: Date | string;
  paidByUserId: string;
  amount: number;
  paidBy: UserSummary;
  splits: { userId: string; amountOwed: number; user: UserSummary }[];
};

type PaymentInput = {
  id: string;
  amount: number;
  createdAt: Date | string;
  fromUserId: string;
  toUserId: string;
  fromUser: UserSummary;
  toUser: UserSummary;
  note?: string | null;
};

export function buildUserBalanceExplanation(
  userId: string,
  expenses: ExpenseInput[],
  payments: PaymentInput[],
  currencySymbol = "$",
  options?: { subjectName?: string },
): { lines: BalanceExplanationLine[]; netBalance: number } {
  const subject = options?.subjectName?.trim() || "You";
  const useThirdPerson = Boolean(options?.subjectName?.trim());
  const youLabel = useThirdPerson ? subject : "You";
  const youObject = useThirdPerson ? subject : "you";

  const lines: BalanceExplanationLine[] = [];

  for (const expense of expenses) {
    const date =
      typeof expense.expenseDate === "string"
        ? expense.expenseDate
        : expense.expenseDate.toISOString();
    const label = expense.description.trim() || "Expense";

    if (expense.paidByUserId === userId) {
      for (const split of expense.splits) {
        if (split.userId === userId || split.amountOwed === 0) continue;
        lines.push({
          kind: "lent",
          expenseId: expense.id,
          counterparty: split.user,
          amount: split.amountOwed,
          netEffect: split.amountOwed,
          text: `${youLabel} paid for ${split.user.name} - ${label} (${formatCents(split.amountOwed, currencySymbol)})`,
          sortDate: date,
        });
      }
    } else {
      const split = expense.splits.find((s) => s.userId === userId);
      if (split && split.amountOwed > 0) {
        lines.push({
          kind: "borrowed",
          expenseId: expense.id,
          counterparty: expense.paidBy,
          amount: split.amountOwed,
          netEffect: -split.amountOwed,
          text: `${expense.paidBy.name} paid for ${youObject} - ${label} (${formatCents(split.amountOwed, currencySymbol)})`,
          sortDate: date,
        });
      }
    }
  }

  for (const payment of payments) {
    const date =
      typeof payment.createdAt === "string"
        ? payment.createdAt
        : payment.createdAt.toISOString();
    const note = payment.note?.trim();

    if (payment.fromUserId === userId) {
      lines.push({
        kind: "payment_out",
        paymentId: payment.id,
        counterparty: payment.toUser,
        amount: payment.amount,
        netEffect: payment.amount,
        text: `${youLabel} paid ${payment.toUser.name} ${formatCents(payment.amount, currencySymbol)}${note ? ` - ${note}` : ""}`,
        sortDate: date,
      });
    }

    if (payment.toUserId === userId) {
      lines.push({
        kind: "payment_in",
        paymentId: payment.id,
        counterparty: payment.fromUser,
        amount: payment.amount,
        netEffect: -payment.amount,
        text: `${payment.fromUser.name} paid ${youObject} ${formatCents(payment.amount, currencySymbol)}${note ? ` - ${note}` : ""}`,
        sortDate: date,
      });
    }
  }

  lines.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  const netBalance = lines.reduce((sum, line) => sum + line.netEffect, 0);

  return { lines, netBalance };
}

export function buildSettlementExplanation(params: {
  fromUser: UserSummary;
  toUser: UserSummary;
  amount: number;
  lines: BalanceExplanationLine[];
  /** Authoritative net from computeGroupBalances (positive = owed money, negative = owes) */
  netBalance: number;
  directDebtAmount?: number;
  currencySymbol?: string;
}): { lines: BalanceExplanationLine[]; summary: string } {
  const {
    fromUser,
    toUser,
    amount,
    lines,
    netBalance,
    directDebtAmount = 0,
    currencySymbol = "$",
  } = params;

  const absNet = Math.abs(netBalance);
  const owes = netBalance < 0;

  let summary: string;

  if (owes && amount === absNet) {
    summary = `${fromUser.name} owes ${formatCents(absNet, currencySymbol)} in this group - pay ${toUser.name} ${formatCents(amount, currencySymbol)} to settle up.`;
  } else if (owes && amount < absNet) {
    summary = `${fromUser.name}'s net balance in this group is ${formatCents(absNet, currencySymbol)} (see breakdown below). After simplifying debts across all members, ${fromUser.name} pays ${toUser.name} ${formatCents(amount, currencySymbol)} in one transaction.`;
    if (directDebtAmount > 0 && directDebtAmount !== amount) {
      summary += ` Direct share owed to ${toUser.name} before simplification: ${formatCents(directDebtAmount, currencySymbol)}.`;
    }
  } else if (owes) {
    summary = `${fromUser.name} owes ${formatCents(absNet, currencySymbol)} in this group. This ${formatCents(amount, currencySymbol)} payment to ${toUser.name} is part of settling up.`;
  } else if (netBalance > 0) {
    summary = `${fromUser.name} is owed ${formatCents(netBalance, currencySymbol)} overall. This ${formatCents(amount, currencySymbol)} payment to ${toUser.name} is part of settling the group.`;
  } else {
    summary = `${fromUser.name} is all settled - this payment clears the remaining balance with ${toUser.name}.`;
  }

  return { lines, summary };
}

export function buildPayerSettlementSummary(params: {
  payerName: string;
  payments: { toName: string; amount: number }[];
  currencySymbol?: string;
}): string {
  const { payerName, payments, currencySymbol = "$" } = params;

  if (payments.length === 0) {
    return `${payerName} has no payments to make in this group.`;
  }

  const formatted = payments.map(
    (payment) => `${payment.toName} ${formatCents(payment.amount, currencySymbol)}`,
  );

  if (formatted.length === 1) {
    return `${payerName} pays ${formatted[0]} to settle up.`;
  }

  const last = formatted.pop();
  return `${payerName} pays ${formatted.join(", ")} and ${last} to settle up.`;
}
