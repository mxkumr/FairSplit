import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { computeGroupBalances } from "@/lib/balances";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const { expenses, payments } = await getGroupBalanceData(groupId);
    const balances = computeGroupBalances(expenses, payments);

    return NextResponse.json(balances);
  } catch (error) {
    return handleApiError(error);
  }
}
