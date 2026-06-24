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
): { lines: BalanceExplanationLine[]; netBalance: number } {
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
          text: `You paid for ${split.user.name} — ${label} (${formatCents(split.amountOwed, currencySymbol)})`,
          sortDate: date,
        });
      }

      const ownSplit = expense.splits.find((s) => s.userId === userId);
      if (ownSplit && ownSplit.amountOwed > 0) {
        lines.push({
          kind: "borrowed",
          expenseId: expense.id,
          counterparty: expense.paidBy,
          amount: ownSplit.amountOwed,
          netEffect: -ownSplit.amountOwed,
          text: `Your share of ${label} (${formatCents(ownSplit.amountOwed, currencySymbol)})`,
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
          text: `${expense.paidBy.name} paid for you — ${label} (${formatCents(split.amountOwed, currencySymbol)})`,
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
        text: `You paid ${payment.toUser.name} ${formatCents(payment.amount, currencySymbol)}${note ? ` — ${note}` : ""}`,
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
        text: `${payment.fromUser.name} paid you ${formatCents(payment.amount, currencySymbol)}${note ? ` — ${note}` : ""}`,
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
  netBalance: number;
  currencySymbol?: string;
}): { lines: BalanceExplanationLine[]; summary: string } {
  const { fromUser, toUser, amount, lines, netBalance, currencySymbol = "$" } = params;

  const summary =
    netBalance < 0
      ? `After adding everything up, ${fromUser.name} owes ${formatCents(Math.abs(netBalance), currencySymbol)} overall — so ${fromUser.name} should pay ${toUser.name} ${formatCents(amount, currencySymbol)} to settle up.`
      : netBalance > 0
        ? `${fromUser.name} is owed ${formatCents(netBalance, currencySymbol)} overall. This ${formatCents(amount, currencySymbol)} payment to ${toUser.name} is part of settling the group.`
        : `${fromUser.name} is all settled — this payment clears the remaining balance with ${toUser.name}.`;

  return { lines, summary };
}
