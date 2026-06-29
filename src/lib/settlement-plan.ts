import { createHash } from "crypto";
import type { Settlement } from "./debt-simplification";
import {
  simplifyDebts,
  simplifyDebtsPreferDirect,
  type DirectDebt,
  type NetBalance,
} from "./debt-simplification";
import { prisma } from "./prisma";

export type StoredSettlementPlan = {
  simplified: Settlement[];
  direct: Settlement[];
};

type ExpenseForFingerprint = {
  id: string;
  amount: number;
  paidByUserId: string;
  expenseDate: Date | string;
  splits: { userId: string; amountOwed: number }[];
};

type PaymentForPlan = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function computeExpenseFingerprint(expenses: ExpenseForFingerprint[]): string {
  const canonical = expenses
    .map((expense) => ({
      id: expense.id,
      amount: expense.amount,
      paidByUserId: expense.paidByUserId,
      expenseDate:
        typeof expense.expenseDate === "string"
          ? expense.expenseDate
          : expense.expenseDate.toISOString(),
      splits: expense.splits
        .map((split) => ({ u: split.userId, o: split.amountOwed }))
        .sort((a, b) => a.u.localeCompare(b.u)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/**
 * Reduce locked settlement amounts as payments are recorded.
 * Exact from→to matches are cleared first so payees stay stable.
 */
export function applyPaymentsToLockedPlan(
  locked: Settlement[],
  payments: PaymentForPlan[],
): Settlement[] {
  const remaining = locked.map((settlement) => ({ ...settlement }));

  for (const payment of payments) {
    let left = payment.amount;

    for (const settlement of remaining) {
      if (left <= 0) break;
      if (
        settlement.fromUserId !== payment.fromUserId ||
        settlement.toUserId !== payment.toUserId ||
        settlement.amount <= 0
      ) {
        continue;
      }
      const applied = Math.min(left, settlement.amount);
      settlement.amount -= applied;
      left -= applied;
    }

    if (left <= 0) continue;

    for (const settlement of remaining) {
      if (left <= 0) break;
      if (settlement.fromUserId !== payment.fromUserId || settlement.amount <= 0) continue;
      const applied = Math.min(left, settlement.amount);
      settlement.amount -= applied;
      left -= applied;
    }
  }

  return remaining
    .filter((settlement) => settlement.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function parseStoredSettlementPlan(value: unknown): StoredSettlementPlan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.simplified) || !Array.isArray(record.direct)) return null;

  function parseSettlements(items: unknown[]): Settlement[] {
    return items
      .filter((item): item is Settlement => {
        if (!item || typeof item !== "object") return false;
        const row = item as Record<string, unknown>;
        return (
          typeof row.fromUserId === "string" &&
          typeof row.toUserId === "string" &&
          typeof row.amount === "number"
        );
      })
      .map((item) => ({ ...item }));
  }

  return {
    simplified: parseSettlements(record.simplified),
    direct: parseSettlements(record.direct),
  };
}

export async function resolveLockedSettlementPlans(params: {
  groupId: string;
  expenses: ExpenseForFingerprint[];
  payments: PaymentForPlan[];
  settlementNets: NetBalance[];
  directDebts: DirectDebt[];
  storedFingerprint: string | null;
  storedPlan: unknown;
}): Promise<{ simplified: Settlement[]; direct: Settlement[]; planRefreshed: boolean }> {
  const fingerprint = computeExpenseFingerprint(params.expenses);
  const parsed = parseStoredSettlementPlan(params.storedPlan);
  let plan = parsed;
  let planRefreshed = false;

  if (!plan || params.storedFingerprint !== fingerprint) {
    plan = {
      simplified: simplifyDebts(params.settlementNets),
      direct: simplifyDebtsPreferDirect(params.settlementNets, params.directDebts),
    };
    planRefreshed = true;
    await prisma.group.update({
      where: { id: params.groupId },
      data: {
        settlementPlanFingerprint: fingerprint,
        settlementPlan: plan,
      },
    });
  }

  return {
    simplified: applyPaymentsToLockedPlan(plan.simplified, params.payments),
    direct: applyPaymentsToLockedPlan(plan.direct, params.payments),
    planRefreshed,
  };
}
