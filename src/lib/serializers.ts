export function serializeExpense(expense: {
  id: string;
  description: string;
  amount: number;
  expenseDate: Date;
  createdAt: Date;
  splitMode: string;
  notes: string | null;
  isReimbursement: boolean;
  recurrenceRule: string;
  categoryId: number | null;
  paidBy: { id: string; name: string; email: string };
  category?: { id: number; grouping: string; name: string } | null;
  splits: {
    userId: string;
    amountOwed: number;
    shares: number;
    user: { id: string; name: string; email: string };
  }[];
  documents?: { id: string; filename: string; mimeType: string; url: string }[];
}) {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    expenseDate: expense.expenseDate.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    splitMode: expense.splitMode,
    notes: expense.notes,
    isReimbursement: expense.isReimbursement,
    recurrenceRule: expense.recurrenceRule,
    categoryId: expense.categoryId,
    category: expense.category ?? null,
    paidBy: expense.paidBy,
    splits: expense.splits.map((s) => ({
      userId: s.userId,
      amountOwed: s.amountOwed,
      shares: s.shares,
      user: s.user,
    })),
    documents: expense.documents ?? [],
  };
}

export function serializeGroup(group: {
  id: string;
  name: string;
  information: string | null;
  currency: string;
  currencySymbol: string;
  createdAt: Date;
  members: { isFavorite?: boolean; user: { id: string; name: string; email: string } }[];
  expenses: Parameters<typeof serializeExpense>[0][];
  payments: {
    id: string;
    amount: number;
    note: string | null;
    createdAt: Date;
    fromUser: { id: string; name: string; email: string };
    toUser: { id: string; name: string; email: string };
  }[];
}) {
  return {
    id: group.id,
    name: group.name,
    information: group.information,
    currency: group.currency,
    currencySymbol: group.currencySymbol,
    createdAt: group.createdAt.toISOString(),
    members: group.members.map((m) => ({
      isFavorite: m.isFavorite ?? false,
      user: m.user,
    })),
    expenses: group.expenses.map(serializeExpense),
    payments: group.payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

const expenseInclude = {
  paidBy: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, grouping: true, name: true } },
  splits: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  documents: true,
} as const;

export { expenseInclude };
