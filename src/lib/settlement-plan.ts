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
 *
 * The locked plan must be built from expense-only nets (before payments).
 * Applying payments to a plan already computed from post-payment nets
 * double-counts and can empty settle-up while balances still show debt.
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

export function buildSettlementPlanFromNets(
  settlementNets: NetBalance[],
  directDebts: DirectDebt[],
): StoredSettlementPlan {
  return {
    simplified: simplifyDebts(settlementNets),
    direct: simplifyDebtsPreferDirect(settlementNets, directDebts),
  };
}

function hasOutstandingNets(nets: NetBalance[]): boolean {
  return nets.some((balance) => balance.amount !== 0);
}

function settlementKey(settlement: Settlement): string {
  return `${settlement.fromUserId}:${settlement.toUserId}:${settlement.amount}`;
}

function plansEqual(a: StoredSettlementPlan, b: StoredSettlementPlan): boolean {
  if (a.simplified.length !== b.simplified.length || a.direct.length !== b.direct.length) {
    return false;
  }
  const simplifiedA = a.simplified.map(settlementKey).sort().join("|");
  const simplifiedB = b.simplified.map(settlementKey).sort().join("|");
  if (simplifiedA !== simplifiedB) return false;
  const directA = a.direct.map(settlementKey).sort().join("|");
  const directB = b.direct.map(settlementKey).sort().join("|");
  return directA === directB;
}

/**
 * Pure resolution of locked settlement suggestions.
 *
 * Locked plans are derived from expense-only nets, then reduced by recorded
 * payments. If a stored plan was incorrectly locked from post-payment nets
 * (empty suggestions while balances remain), rebuild from expense-only.
 * If off-route payments still leave residual nets with no locked routes,
 * fall back to live simplification of current nets (not persisted).
 */
export function resolveSettlementPlanState(params: {
  expenses: ExpenseForFingerprint[];
  payments: PaymentForPlan[];
  /** Nets/debts from expenses only — used to lock the plan. */
  expenseOnlySettlementNets: NetBalance[];
  expenseOnlyDirectDebts: DirectDebt[];
  /** Current nets/debts after payments — used for heal / live fallback. */
  settlementNets: NetBalance[];
  directDebts: DirectDebt[];
  storedFingerprint: string | null;
  storedPlan: unknown;
}): {
  simplified: Settlement[];
  direct: Settlement[];
  planToPersist: StoredSettlementPlan | null;
  fingerprint: string;
  planRefreshed: boolean;
  usedLiveFallback: boolean;
} {
  const fingerprint = computeExpenseFingerprint(params.expenses);
  const expenseOnlyPlan = buildSettlementPlanFromNets(
    params.expenseOnlySettlementNets,
    params.expenseOnlyDirectDebts,
  );

  let plan = parseStoredSettlementPlan(params.storedPlan);
  let planToPersist: StoredSettlementPlan | null = null;
  let planRefreshed = false;
  let usedLiveFallback = false;

  if (!plan || params.storedFingerprint !== fingerprint) {
    plan = expenseOnlyPlan;
    planToPersist = expenseOnlyPlan;
    planRefreshed = true;
  }

  let simplified = applyPaymentsToLockedPlan(plan.simplified, params.payments);
  let direct = applyPaymentsToLockedPlan(plan.direct, params.payments);

  if (hasOutstandingNets(params.settlementNets) && simplified.length === 0) {
    const healedSimplified = applyPaymentsToLockedPlan(
      expenseOnlyPlan.simplified,
      params.payments,
    );
    const healedDirect = applyPaymentsToLockedPlan(expenseOnlyPlan.direct, params.payments);

    if (healedSimplified.length > 0) {
      // Stored plan was likely locked from post-payment nets (double-count).
      plan = expenseOnlyPlan;
      planToPersist = expenseOnlyPlan;
      planRefreshed = true;
      simplified = healedSimplified;
      direct = healedDirect;
    } else {
      // Off-route payments cleared locked routes; show live residual suggestions.
      const live = buildSettlementPlanFromNets(params.settlementNets, params.directDebts);
      simplified = live.simplified;
      direct = live.direct;
      usedLiveFallback = true;
      if (!plansEqual(plan, expenseOnlyPlan)) {
        planToPersist = expenseOnlyPlan;
        planRefreshed = true;
      }
    }
  }

  return {
    simplified,
    direct,
    planToPersist,
    fingerprint,
    planRefreshed,
    usedLiveFallback,
  };
}

export async function resolveLockedSettlementPlans(params: {
  groupId: string;
  expenses: ExpenseForFingerprint[];
  payments: PaymentForPlan[];
  expenseOnlySettlementNets: NetBalance[];
  expenseOnlyDirectDebts: DirectDebt[];
  settlementNets: NetBalance[];
  directDebts: DirectDebt[];
  storedFingerprint: string | null;
  storedPlan: unknown;
}): Promise<{ simplified: Settlement[]; direct: Settlement[]; planRefreshed: boolean }> {
  const resolved = resolveSettlementPlanState(params);

  if (resolved.planToPersist) {
    await prisma.group.update({
      where: { id: params.groupId },
      data: {
        settlementPlanFingerprint: resolved.fingerprint,
        settlementPlan: resolved.planToPersist,
      },
    });
  }

  return {
    simplified: resolved.simplified,
    direct: resolved.direct,
    planRefreshed: resolved.planRefreshed,
  };
}
