import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { computeGroupBalances, computeDashboardBalance } from "@/lib/balances";
import { handleApiError } from "@/lib/api-helpers";
import { getGroupBalanceData } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: { group: { select: { id: true, name: true } } },
    });

    const groupBalances = await Promise.all(
      memberships.map(async (m) => {
        const { expenses, payments } = await getGroupBalanceData(m.group.id);
        const result = computeGroupBalances(expenses, payments);
        return {
          groupId: m.group.id,
          groupName: m.group.name,
          netBalances: result.netBalances,
          debts: result.debts,
        };
      }),
    );

    const dashboard = computeDashboardBalance(session.userId, groupBalances);

    return NextResponse.json(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
