import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ groupId: string; userId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, userId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { createdByUserId: true },
    });

    if (!group) {
      throw new Error("NOT_FOUND");
    }

    if (userId === group.createdByUserId) {
      return jsonError("Cannot remove the group creator", 400);
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      return jsonError("Member not found", 404);
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
