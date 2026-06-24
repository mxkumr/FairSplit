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

type PaymentRecord = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: UserSummary;
  toUser: UserSummary;
};

function applyDebt(
  debtMap: Map<string, number>,
  fromUserId: string,
  toUserId: string,
  amount: number,
) {
  if (fromUserId === toUserId || amount === 0) return;

  const forwardKey = `${fromUserId}:${toUserId}`;
  const reverseKey = `${toUserId}:${fromUserId}`;
  const forward = debtMap.get(forwardKey) ?? 0;
  const reverse = debtMap.get(reverseKey) ?? 0;

  if (forward > 0) {
    const net = forward - amount;
    if (net > 0) {
      debtMap.set(forwardKey, net);
    } else {
      debtMap.delete(forwardKey);
      if (net < 0) debtMap.set(reverseKey, Math.abs(net));
    }
  } else if (reverse > 0) {
    debtMap.set(reverseKey, reverse + amount);
  } else {
    debtMap.set(forwardKey, amount);
  }
}

export function computeGroupBalances(
  expenses: ExpenseWithSplits[],
  payments: PaymentRecord[] = [],
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
        applyDebt(debtMap, split.userId, expense.paidByUserId, split.amountOwed);
      }
    }
  }

  for (const payment of payments) {
    userMap.set(payment.fromUser.id, payment.fromUser);
    userMap.set(payment.toUser.id, payment.toUser);

    const fromNet = netMap.get(payment.fromUserId) ?? 0;
    netMap.set(payment.fromUserId, fromNet + payment.amount);

    const toNet = netMap.get(payment.toUserId) ?? 0;
    netMap.set(payment.toUserId, toNet - payment.amount);

    applyDebt(debtMap, payment.fromUserId, payment.toUserId, payment.amount);
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

/** @deprecated Use computeGroupBalances */
export function computeBalancesFromExpenses(expenses: ExpenseWithSplits[]): GroupBalanceResult {
  return computeGroupBalances(expenses);
}

export type DashboardBalance = {
  totalOwed: number;
  totalOwing: number;
  groups: {
    groupId: string;
    groupName: string;
    netAmount: number;
  }[];
  friends: FriendBalanceEntry[];
};

export type FriendBalanceEntry = {
  userId: string;
  name: string;
  email: string;
  netAmount: number;
};

export function computeDashboardBalance(
  userId: string,
  groupBalances: {
    groupId: string;
    groupName: string;
    netBalances: NetBalanceEntry[];
    debts: DebtEntry[];
  }[],
): DashboardBalance {
  let totalOwed = 0;
  let totalOwing = 0;
  const groups: DashboardBalance["groups"] = [];
  const friendMap = new Map<string, FriendBalanceEntry>();

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

    for (const debt of group.debts) {
      if (debt.toUserId === userId) {
        const existing = friendMap.get(debt.fromUserId);
        if (existing) {
          existing.netAmount += debt.amount;
        } else {
          friendMap.set(debt.fromUserId, {
            userId: debt.fromUserId,
            name: debt.fromUser.name,
            email: debt.fromUser.email,
            netAmount: debt.amount,
          });
        }
      }
      if (debt.fromUserId === userId) {
        const existing = friendMap.get(debt.toUserId);
        if (existing) {
          existing.netAmount -= debt.amount;
        } else {
          friendMap.set(debt.toUserId, {
            userId: debt.toUserId,
            name: debt.toUser.name,
            email: debt.toUser.email,
            netAmount: -debt.amount,
          });
        }
      }
    }
  }

  const friends = [...friendMap.values()]
    .filter((f) => f.netAmount !== 0)
    .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount));

  return { totalOwed, totalOwing, groups, friends };
}

export type { Settlement };
