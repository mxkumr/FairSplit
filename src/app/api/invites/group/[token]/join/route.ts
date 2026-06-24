import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { token } = await context.params;

    const group = await prisma.group.findUnique({
      where: { inviteToken: token },
      select: { id: true, name: true },
    });

    if (!group) {
      return jsonError("Invite link is invalid or expired", 404);
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.userId } },
    });

    if (existing) {
      return NextResponse.json({
        groupId: group.id,
        alreadyMember: true,
        message: "You are already in this group",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    await prisma.groupMember.create({
      data: { groupId: group.id, userId: session.userId },
    });

    await logActivity({
      groupId: group.id,
      activityType: "ADD_MEMBER",
      userId: session.userId,
      data: {
        memberName: user?.name,
        memberEmail: user?.email,
        viaInvite: true,
      },
    });

    return NextResponse.json({
      groupId: group.id,
      alreadyMember: false,
      message: `Joined ${group.name}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
