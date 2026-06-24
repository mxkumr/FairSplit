import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { computeGroupBalances } from "@/lib/balances";
import { simplifyDebts } from "@/lib/debt-simplification";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const { expenses, payments } = await getGroupBalanceData(groupId);
    const { netBalances } = computeGroupBalances(expenses, payments);
    const rawSettlements = simplifyDebts(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
    );

    const userMap = new Map(netBalances.map((b) => [b.userId, b.user]));

    const settlements = rawSettlements.map((s) => {
      const fromUser = userMap.get(s.fromUserId);
      const toUser = userMap.get(s.toUserId);
      if (!fromUser || !toUser) {
        throw new Error("Missing user in settlement");
      }
      return { ...s, fromUser, toUser };
    });

    return NextResponse.json({
      settlements,
      transactionCount: settlements.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
