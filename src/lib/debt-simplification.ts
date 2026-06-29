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

export type SettlementModeKey = "simplified" | "direct";

/** Tolerance for cent rounding when validating settlement totals. */
export const SETTLEMENT_TOLERANCE_CENTS = 1;

function mergeSettlements(settlements: Settlement[]): Settlement[] {
  const map = new Map<string, Settlement>();
  for (const settlement of settlements) {
    const key = `${settlement.fromUserId}:${settlement.toUserId}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += settlement.amount;
    } else {
      map.set(key, { ...settlement });
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

/**
 * Stable ordering so suggested payments do not reshuffle after recording one.
 * Creditors (positive net) before debtors (negative net); then by magnitude; then user id.
 */
function compareNetBalancesForSettlement(a: NetBalance, b: NetBalance): number {
  if (a.amount > 0 && b.amount < 0) return -1;
  if (a.amount < 0 && b.amount > 0) return 1;
  if (a.amount !== b.amount) {
    return Math.abs(b.amount) - Math.abs(a.amount);
  }
  return a.userId.localeCompare(b.userId);
}

/**
 * Greedy net-balance matching: largest debtor to largest creditor until nets are zero.
 * Matches the largest creditor with the largest debtor until all nets are zero.
 *
 * Guarantees:
 * - No debtor pays more than their net debt.
 * - No creditor receives more than their net credit.
 */
export function simplifyDebts(netBalances: NetBalance[]): Settlement[] {
  const balances = netBalances
    .filter((balance) => balance.amount !== 0)
    .map((balance) => ({ userId: balance.userId, amount: balance.amount }))
    .sort(compareNetBalancesForSettlement);

  const settlements: Settlement[] = [];

  while (balances.length > 1) {
    const creditor = balances[0];
    const debtor = balances[balances.length - 1];
    const transfer = Math.min(creditor.amount, Math.abs(debtor.amount));

    if (transfer > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: transfer,
      });
    }

    creditor.amount -= transfer;
    debtor.amount += transfer;

    if (creditor.amount === 0) {
      balances.shift();
    }
    if (debtor.amount === 0) {
      balances.pop();
    }
  }

  return mergeSettlements(settlements);
}

/**
 * Pay along direct expense debts first (who covered your share), then greedily
 * clear any remaining net balances.
 */
export function simplifyDebtsPreferDirect(
  netBalances: NetBalance[],
  directDebts: DirectDebt[],
): Settlement[] {
  const settlements: Settlement[] = [];
  const debtorRemaining = new Map<string, number>();
  const creditorRemaining = new Map<string, number>();

  for (const balance of netBalances) {
    if (balance.amount < 0) debtorRemaining.set(balance.userId, Math.abs(balance.amount));
    if (balance.amount > 0) creditorRemaining.set(balance.userId, balance.amount);
  }

  const sortedDirect = [...directDebts].sort((a, b) => b.amount - a.amount);
  for (const debt of sortedDirect) {
    const debtorAmount = debtorRemaining.get(debt.fromUserId) ?? 0;
    const creditorAmount = creditorRemaining.get(debt.toUserId) ?? 0;
    const transfer = Math.min(debt.amount, debtorAmount, creditorAmount);
    if (transfer <= 0) continue;

    settlements.push({
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount: transfer,
    });
    debtorRemaining.set(debt.fromUserId, debtorAmount - transfer);
    creditorRemaining.set(debt.toUserId, creditorAmount - transfer);
    if (debtorAmount - transfer === 0) debtorRemaining.delete(debt.fromUserId);
    if (creditorAmount - transfer === 0) creditorRemaining.delete(debt.toUserId);
  }

  const remainingNets: NetBalance[] = [];
  for (const [userId, owes] of debtorRemaining) {
    if (owes > 0) remainingNets.push({ userId, amount: -owes });
  }
  for (const [userId, owed] of creditorRemaining) {
    if (owed > 0) remainingNets.push({ userId, amount: owed });
  }

  const hasDebtor = remainingNets.some((balance) => balance.amount < 0);
  const hasCreditor = remainingNets.some((balance) => balance.amount > 0);
  if (hasDebtor && hasCreditor) {
    settlements.push(...simplifyDebts(remainingNets));
  }

  return mergeSettlements(settlements);
}

export function sumSettlementsForUser(
  settlements: Settlement[],
  userId: string,
  role: "from" | "to",
): number {
  return settlements
    .filter((settlement) =>
      role === "from" ? settlement.fromUserId === userId : settlement.toUserId === userId,
    )
    .reduce((sum, settlement) => sum + settlement.amount, 0);
}

/**
 * Verifies settlements respect net balances (no overpay / no over-credit).
 */
export function validateSettlements(
  settlements: Settlement[],
  netBalances: NetBalance[],
  toleranceCents = SETTLEMENT_TOLERANCE_CENTS,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const netByUser = new Map(netBalances.map((balance) => [balance.userId, balance.amount]));

  for (const [userId, net] of netByUser) {
    const paid = sumSettlementsForUser(settlements, userId, "from");
    const received = sumSettlementsForUser(settlements, userId, "to");

    if (net < 0) {
      const maxPay = Math.abs(net);
      if (paid > maxPay + toleranceCents) {
        errors.push(`${userId} pays ${paid} but only owes ${maxPay}`);
      }
      if (Math.abs(paid - maxPay) > toleranceCents) {
        errors.push(`${userId} should pay ${maxPay} but pays ${paid}`);
      }
      if (received > toleranceCents) {
        errors.push(`${userId} is a net debtor but receives ${received}`);
      }
    } else if (net > 0) {
      if (received > net + toleranceCents) {
        errors.push(`${userId} receives ${received} but is only owed ${net}`);
      }
      if (Math.abs(received - net) > toleranceCents) {
        errors.push(`${userId} should receive ${net} but receives ${received}`);
      }
      if (paid > toleranceCents) {
        errors.push(`${userId} is a net creditor but pays ${paid}`);
      }
    } else if (paid > toleranceCents || received > toleranceCents) {
      errors.push(`${userId} is settled but has payment activity`);
    }
  }

  return { valid: errors.length === 0, errors };
}
