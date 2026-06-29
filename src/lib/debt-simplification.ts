export type Settlement = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type NetBalance = {
  userId: string;
  amount: number;
};

export type DirectDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

function mergeSettlements(settlements: Settlement[]): Settlement[] {
  const map = new Map<string, Settlement>();
  for (const s of settlements) {
    const key = `${s.fromUserId}:${s.toUserId}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += s.amount;
    } else {
      map.set(key, { ...s });
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function simplifyDebts(netBalances: NetBalance[]): Settlement[] {
  /** Greedy match of largest debtors to creditors - at most n−1 payments for n people. */
  const creditors = netBalances
    .filter((b) => b.amount > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = netBalances
    .filter((b) => b.amount < 0)
    .map((b) => ({ userId: b.userId, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const transfer = Math.min(creditor.amount, debtor.amount);

    if (transfer > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: transfer,
      });
    }

    creditor.amount -= transfer;
    debtor.amount -= transfer;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return settlements;
}

/**
 * Settle along direct pairwise debts first (who actually paid for your share),
 * then greedily clear any remaining net balances.
 */
export function simplifyDebtsPreferDirect(
  netBalances: NetBalance[],
  directDebts: DirectDebt[],
): Settlement[] {
  const settlements: Settlement[] = [];
  const debtorRemaining = new Map<string, number>();
  const creditorRemaining = new Map<string, number>();

  for (const b of netBalances) {
    if (b.amount < 0) debtorRemaining.set(b.userId, Math.abs(b.amount));
    if (b.amount > 0) creditorRemaining.set(b.userId, b.amount);
  }

  const sortedDirect = [...directDebts].sort((a, b) => b.amount - a.amount);
  for (const debt of sortedDirect) {
    const dr = debtorRemaining.get(debt.fromUserId) ?? 0;
    const cr = creditorRemaining.get(debt.toUserId) ?? 0;
    const transfer = Math.min(debt.amount, dr, cr);
    if (transfer <= 0) continue;

    settlements.push({
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount: transfer,
    });
    debtorRemaining.set(debt.fromUserId, dr - transfer);
    creditorRemaining.set(debt.toUserId, cr - transfer);
  }

  const remainingNets: NetBalance[] = [];
  const userIds = new Set([...debtorRemaining.keys(), ...creditorRemaining.keys()]);
  for (const userId of userIds) {
    const owed = creditorRemaining.get(userId) ?? 0;
    const owes = debtorRemaining.get(userId) ?? 0;
    const net = owed - owes;
    if (net !== 0) {
      remainingNets.push({ userId, amount: net });
    }
  }

  if (remainingNets.length > 0) {
    settlements.push(...simplifyDebts(remainingNets));
  }

  return mergeSettlements(settlements);
}
