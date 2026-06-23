export type Settlement = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type NetBalance = {
  userId: string;
  amount: number;
};

export function simplifyDebts(netBalances: NetBalance[]): Settlement[] {
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
