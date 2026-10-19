import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  buildSettlementExplanation,
  buildUserBalanceExplanation,
} from "@/lib/balance-explanation";
import { computeGroupBalances } from "@/lib/balances";
import {
  netsForSettlementSuggestions,
  type Settlement,
  type SettlementModeKey,
} from "@/lib/debt-simplification";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
import { resolveLockedSettlementPlans } from "@/lib/settlement-plan";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/api-client";

type RouteContext = { params: Promise<{ groupId: string }> };

type BalanceEntry = {
  userId: string;
  amount: number;
  user: AuthUser;
};

type DebtEntry = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

type ExpenseForExplanation = Parameters<typeof buildUserBalanceExplanation>[1];
type PaymentForExplanation = Parameters<typeof buildUserBalanceExplanation>[2];

function collectUsersFromActivity(
  expenses: ExpenseForExplanation,
  payments: PaymentForExplanation,
): Map<string, AuthUser> {
  const userMap = new Map<string, AuthUser>();
  for (const expense of expenses) {
    userMap.set(expense.paidBy.id, expense.paidBy);
    for (const split of expense.splits) {
      userMap.set(split.user.id, split.user);
    }
  }
  for (const payment of payments) {
    userMap.set(payment.fromUser.id, payment.fromUser);
    userMap.set(payment.toUser.id, payment.toUser);
  }
  return userMap;
}

function enrichSettlements(
  rawSettlements: Settlement[],
  netBalances: BalanceEntry[],
  debts: DebtEntry[],
  expenses: ExpenseForExplanation,
  payments: PaymentForExplanation,
  currencySymbol: string,
) {
  const userMap = collectUsersFromActivity(expenses, payments);
  for (const balance of netBalances) {
    userMap.set(balance.userId, balance.user);
  }
  const explanationCache = new Map<
    string,
    ReturnType<typeof buildUserBalanceExplanation>
  >();

  function getExplanation(userId: string) {
    let cached = explanationCache.get(userId);
    if (!cached) {
      const user = userMap.get(userId);
      cached = buildUserBalanceExplanation(userId, expenses, payments, currencySymbol, {
        subjectName: user?.name,
      });
      explanationCache.set(userId, cached);
    }
    return cached;
  }

  const enriched = [];
  for (const settlement of rawSettlements) {
    const fromUser = userMap.get(settlement.fromUserId);
    const toUser = userMap.get(settlement.toUserId);
    // Locked plans can briefly reference users who already netted to zero.
    // Skip instead of failing the whole settlements response.
    if (!fromUser || !toUser) {
      continue;
    }

    const payerNet =
      netBalances.find((balance) => balance.userId === settlement.fromUserId)?.amount ?? 0;
    const directDebt =
      debts.find(
        (debt) =>
          debt.fromUserId === settlement.fromUserId &&
          debt.toUserId === settlement.toUserId,
      )?.amount ?? 0;

    const payerExplanation = getExplanation(settlement.fromUserId);
    const { lines, summary } = buildSettlementExplanation({
      fromUser,
      toUser,
      amount: settlement.amount,
      lines: payerExplanation.lines,
      netBalance: payerNet,
      directDebtAmount: directDebt,
      currencySymbol,
    });

    enriched.push({
      ...settlement,
      fromUser,
      toUser,
      explanation: { lines, summary },
    });
  }
  return enriched;
}

function buildModeResult(
  rawSettlements: Settlement[],
  rawDebtCount: number,
  netBalances: BalanceEntry[],
  debts: DebtEntry[],
  expenses: ExpenseForExplanation,
  payments: PaymentForExplanation,
  currencySymbol: string,
) {
  const settlements = enrichSettlements(
    rawSettlements,
    netBalances,
    debts,
    expenses,
    payments,
    currencySymbol,
  );
  const transactionCount = settlements.length;

  return {
    settlements,
    transactionCount,
    paymentsSaved: Math.max(0, rawDebtCount - transactionCount),
  };
}

function toSettlementModeKey(mode: "SIMPLIFIED" | "DIRECT"): SettlementModeKey {
  return mode === "DIRECT" ? "direct" : "simplified";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const { expenses, payments } = await getGroupBalanceData(groupId);
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        currencySymbol: true,
        settlementMode: true,
        settlementPlanFingerprint: true,
        settlementPlan: true,
      },
    });
    const currencySymbol = group?.currencySymbol ?? "$";
    const defaultMode = toSettlementModeKey(group?.settlementMode ?? "DIRECT");

    const { debts, netBalances } = computeGroupBalances(expenses, payments);
    const expenseOnlyBalances = computeGroupBalances(expenses, []);
    const nets = netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));
    const settlementNets = netsForSettlementSuggestions(nets);
    const expenseOnlyNets = netsForSettlementSuggestions(
      expenseOnlyBalances.netBalances.map((balance) => ({
        userId: balance.userId,
        amount: balance.amount,
      })),
    );
    const directDebts = debts.map((debt) => ({
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount: debt.amount,
    }));
    const expenseOnlyDirectDebts = expenseOnlyBalances.debts.map((debt) => ({
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount: debt.amount,
    }));

    const rawDebtCount = debts.length;
    const shared = {
      netBalances,
      debts: directDebts,
      expenses,
      payments,
      currencySymbol,
      rawDebtCount,
    };

    const lockedPlans = await resolveLockedSettlementPlans({
      groupId,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        amount: expense.amount,
        paidByUserId: expense.paidByUserId,
        expenseDate: expense.expenseDate,
        splits: expense.splits.map((split) => ({
          userId: split.userId,
          amountOwed: split.amountOwed,
        })),
      })),
      payments: payments.map((payment) => ({
        fromUserId: payment.fromUserId,
        toUserId: payment.toUserId,
        amount: payment.amount,
      })),
      // Lock against expense-only nets so applying payments does not double-count.
      expenseOnlySettlementNets: expenseOnlyNets,
      expenseOnlyDirectDebts,
      settlementNets,
      directDebts,
      storedFingerprint: group?.settlementPlanFingerprint ?? null,
      storedPlan: group?.settlementPlan ?? null,
    });

    const modes = {
      simplified: buildModeResult(
        lockedPlans.simplified,
        rawDebtCount,
        shared.netBalances,
        shared.debts,
        shared.expenses,
        shared.payments,
        shared.currencySymbol,
      ),
      direct: buildModeResult(
        lockedPlans.direct,
        rawDebtCount,
        shared.netBalances,
        shared.debts,
        shared.expenses,
        shared.payments,
        shared.currencySymbol,
      ),
    };

    const active = modes[defaultMode];

    return NextResponse.json({
      defaultMode,
      settlements: active.settlements,
      transactionCount: active.transactionCount,
      rawDebtCount,
      paymentsSaved: active.paymentsSaved,
      settlementPlanLocked: true,
      modes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
