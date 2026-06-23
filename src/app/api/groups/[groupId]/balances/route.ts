import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { computeBalancesFromExpenses } from "@/lib/balances";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupExpensesForBalances } from "@/lib/groups";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const expenses = await getGroupExpensesForBalances(groupId);
    const balances = computeBalancesFromExpenses(expenses);

    return NextResponse.json(balances);
  } catch (error) {
    return handleApiError(error);
  }
}
