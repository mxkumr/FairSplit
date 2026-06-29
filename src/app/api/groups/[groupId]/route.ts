import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { getCurrencySymbol } from "@/lib/currencies";
import { processRecurringExpenses } from "@/lib/recurring";
import { expenseInclude, serializeGroup } from "@/lib/serializers";
import { prisma } from "@/lib/prisma";
import { updateGroupSchema } from "@/lib/validations/group";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    await processRecurringExpenses(groupId);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: "desc" },
        },
        expenses: {
          include: expenseInclude,
          orderBy: { expenseDate: "desc" },
        },
        payments: {
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!group) {
      throw new Error("NOT_FOUND");
    }

    const membership = group.members.find((m) => m.userId === session.userId);

    return NextResponse.json({
      group: {
        ...serializeGroup(group),
        isFavorite: membership?.isFavorite ?? false,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const updateData = { ...parsed.data };
    if (updateData.currency) {
      updateData.currencySymbol = getCurrencySymbol(updateData.currency);
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
    });

    const { logActivity } = await import("@/lib/activity");
    await logActivity({
      groupId,
      activityType: "UPDATE_GROUP",
      userId: session.userId,
      data: updateData,
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        information: group.information,
        currency: group.currency,
        currencySymbol: group.currencySymbol,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
