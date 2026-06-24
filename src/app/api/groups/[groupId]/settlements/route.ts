import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  buildSettlementExplanation,
  buildUserBalanceExplanation,
} from "@/lib/balance-explanation";
import { computeGroupBalances } from "@/lib/balances";
import { simplifyDebts } from "@/lib/debt-simplification";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const { expenses, payments } = await getGroupBalanceData(groupId);
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { currencySymbol: true },
    });
    const currencySymbol = group?.currencySymbol ?? "$";

    const { debts, netBalances } = computeGroupBalances(expenses, payments);
    const rawSettlements = simplifyDebts(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
    );

    const userMap = new Map(netBalances.map((b) => [b.userId, b.user]));

    const explanationCache = new Map<
      string,
      ReturnType<typeof buildUserBalanceExplanation>
    >();

    function getExplanation(userId: string) {
      let cached = explanationCache.get(userId);
      if (!cached) {
        cached = buildUserBalanceExplanation(userId, expenses, payments, currencySymbol);
        explanationCache.set(userId, cached);
      }
      return cached;
    }

    const settlements = rawSettlements.map((s) => {
      const fromUser = userMap.get(s.fromUserId);
      const toUser = userMap.get(s.toUserId);
      if (!fromUser || !toUser) {
        throw new Error("Missing user in settlement");
      }

      const payerExplanation = getExplanation(s.fromUserId);
      const { lines, summary } = buildSettlementExplanation({
        fromUser,
        toUser,
        amount: s.amount,
        lines: payerExplanation.lines,
        netBalance: payerExplanation.netBalance,
        currencySymbol,
      });

      return {
        ...s,
        fromUser,
        toUser,
        explanation: { lines, summary },
      };
    });

    const rawDebtCount = debts.length;
    const simplifiedCount = settlements.length;

    return NextResponse.json({
      settlements,
      transactionCount: simplifiedCount,
      rawDebtCount,
      paymentsSaved: Math.max(0, rawDebtCount - simplifiedCount),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
