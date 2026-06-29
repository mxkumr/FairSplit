import type { NetBalanceEntry } from "@/lib/balances";
import { computeGroupBalances } from "@/lib/balances";

export function validatePaymentAmount(
  netBalances: NetBalanceEntry[],
  fromUserId: string,
  toUserId: string,
  amount: number,
): string | null {
  const payerNet = netBalances.find((balance) => balance.userId === fromUserId)?.amount ?? 0;
  const recipientNet =
    netBalances.find((balance) => balance.userId === toUserId)?.amount ?? 0;

  if (payerNet >= 0) {
    return "Payer has no outstanding debt in this group";
  }

  if (recipientNet <= 0) {
    return "Recipient is not owed money in this group";
  }

  const maxPayerAmount = Math.abs(payerNet);
  if (amount > maxPayerAmount) {
    return `Payment exceeds payer net debt of ${maxPayerAmount} cents`;
  }

  if (amount > recipientNet) {
    return `Payment exceeds recipient net credit of ${recipientNet} cents`;
  }

  return null;
}

type BalanceExpenseInput = {
  paidByUserId: string;
  amount: number;
  paidBy: { id: string; name: string; email: string };
  splits: { userId: string; amountOwed: number; user: { id: string; name: string; email: string } }[];
};

type BalancePaymentInput = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: { id: string; name: string; email: string };
  toUser: { id: string; name: string; email: string };
};

export function getMaxPaymentAmountAfterRemoving(
  expenses: BalanceExpenseInput[],
  payments: BalancePaymentInput[],
  excludePaymentId: string,
  fromUserId: string,
  toUserId: string,
): number {
  const otherPayments = payments
    .filter((payment) => payment.id !== excludePaymentId)
    .map(({ fromUserId, toUserId, amount, fromUser, toUser }) => ({
      fromUserId,
      toUserId,
      amount,
      fromUser,
      toUser,
    }));
  const { netBalances } = computeGroupBalances(expenses, otherPayments);
  const payerNet = netBalances.find((balance) => balance.userId === fromUserId)?.amount ?? 0;
  const recipientNet =
    netBalances.find((balance) => balance.userId === toUserId)?.amount ?? 0;

  if (payerNet >= 0 || recipientNet <= 0) {
    return 0;
  }

  return Math.min(Math.abs(payerNet), recipientNet);
}
