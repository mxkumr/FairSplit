import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  buildSettlementExplanation,
  buildUserBalanceExplanation,
} from "@/lib/balance-explanation";
import { computeGroupBalances } from "@/lib/balances";
import {
  simplifyDebts,
  simplifyDebtsPreferDirect,
  type Settlement,
  type SettlementModeKey,
} from "@/lib/debt-simplification";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
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

function enrichSettlements(
  rawSettlements: Settlement[],
  netBalances: BalanceEntry[],
  debts: DebtEntry[],
  expenses: ExpenseForExplanation,
  payments: PaymentForExplanation,
  currencySymbol: string,
) {
  const userMap = new Map(netBalances.map((balance) => [balance.userId, balance.user]));
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

  return rawSettlements.map((settlement) => {
    const fromUser = userMap.get(settlement.fromUserId);
    const toUser = userMap.get(settlement.toUserId);
    if (!fromUser || !toUser) {
      throw new Error("Missing user in settlement");
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

    return {
      ...settlement,
      fromUser,
      toUser,
      explanation: { lines, summary },
    };
  });
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
      select: { currencySymbol: true, settlementMode: true },
    });
    const currencySymbol = group?.currencySymbol ?? "$";
    const defaultMode = toSettlementModeKey(group?.settlementMode ?? "DIRECT");

    const { debts, netBalances } = computeGroupBalances(expenses, payments);
    const nets = netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));
    const directDebts = debts.map((debt) => ({
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

    const modes = {
      simplified: buildModeResult(
        simplifyDebts(nets),
        rawDebtCount,
        shared.netBalances,
        shared.debts,
        shared.expenses,
        shared.payments,
        shared.currencySymbol,
      ),
      direct: buildModeResult(
        simplifyDebtsPreferDirect(nets, directDebts),
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
      modes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
