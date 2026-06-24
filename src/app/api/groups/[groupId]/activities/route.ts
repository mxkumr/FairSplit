import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getGroupActivities } from "@/lib/activity";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const activities = await getGroupActivities(groupId);

    return NextResponse.json({
      activities: activities.map((a: (typeof activities)[number]) => ({
        id: a.id,
        activityType: a.activityType,
        user: a.user,
        expenseId: a.expenseId,
        data: a.data ? JSON.parse(a.data) : null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
