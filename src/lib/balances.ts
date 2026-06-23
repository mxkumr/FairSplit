import type { Settlement } from "./debt-simplification";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type DebtEntry = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: UserSummary;
  toUser: UserSummary;
};

export type NetBalanceEntry = {
  userId: string;
  amount: number;
  user: UserSummary;
};

export type GroupBalanceResult = {
  debts: DebtEntry[];
  netBalances: NetBalanceEntry[];
};

type ExpenseWithSplits = {
  paidByUserId: string;
  amount: number;
  splits: { userId: string; amountOwed: number; user: UserSummary }[];
  paidBy: UserSummary;
};

export function computeBalancesFromExpenses(
  expenses: ExpenseWithSplits[],
): GroupBalanceResult {
  const debtMap = new Map<string, number>();
  const netMap = new Map<string, number>();
  const userMap = new Map<string, UserSummary>();

  for (const expense of expenses) {
    userMap.set(expense.paidBy.id, expense.paidBy);

    const currentPayerNet = netMap.get(expense.paidByUserId) ?? 0;
    netMap.set(expense.paidByUserId, currentPayerNet + expense.amount);

    for (const split of expense.splits) {
      userMap.set(split.user.id, split.user);

      const currentNet = netMap.get(split.userId) ?? 0;
      netMap.set(split.userId, currentNet - split.amountOwed);

      if (split.userId !== expense.paidByUserId) {
        const key = `${split.userId}:${expense.paidByUserId}`;
        debtMap.set(key, (debtMap.get(key) ?? 0) + split.amountOwed);
      }
    }
  }

  const debts: DebtEntry[] = [];
  for (const [key, amount] of debtMap.entries()) {
    if (amount <= 0) continue;
    const [fromUserId, toUserId] = key.split(":");
    const fromUser = userMap.get(fromUserId);
    const toUser = userMap.get(toUserId);
    if (!fromUser || !toUser) continue;

    debts.push({ fromUserId, toUserId, amount, fromUser, toUser });
  }

  debts.sort((a, b) => b.amount - a.amount);

  const netBalances: NetBalanceEntry[] = [];
  for (const [userId, amount] of netMap.entries()) {
    if (amount === 0) continue;
    const user = userMap.get(userId);
    if (!user) continue;
    netBalances.push({ userId, amount, user });
  }

  netBalances.sort((a, b) => b.amount - a.amount);

  return { debts, netBalances };
}

export type DashboardBalance = {
  totalOwed: number;
  totalOwing: number;
  groups: {
    groupId: string;
    groupName: string;
    netAmount: number;
  }[];
};

export function computeDashboardBalance(
  userId: string,
  groupBalances: { groupId: string; groupName: string; netBalances: NetBalanceEntry[] }[],
): DashboardBalance {
  let totalOwed = 0;
  let totalOwing = 0;
  const groups: DashboardBalance["groups"] = [];

  for (const group of groupBalances) {
    const entry = group.netBalances.find((b) => b.userId === userId);
    const netAmount = entry?.amount ?? 0;

    if (netAmount > 0) totalOwed += netAmount;
    if (netAmount < 0) totalOwing += Math.abs(netAmount);

    groups.push({
      groupId: group.groupId,
      groupName: group.groupName,
      netAmount,
    });
  }

  return { totalOwed, totalOwing, groups };
}

export type { Settlement };
