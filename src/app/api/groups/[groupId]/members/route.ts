import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { addMemberSchema } from "@/lib/validations/group";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const user = parsed.data.userId
      ? await prisma.user.findUnique({
          where: { id: parsed.data.userId },
          select: { id: true, name: true, email: true },
        })
      : await prisma.user.findUnique({
          where: { email: parsed.data.email!.trim().toLowerCase() },
          select: { id: true, name: true, email: true },
        });

    if (!user) {
      return jsonError("No user found with that email", 404);
    }

    if (user.id === session.userId) {
      return jsonError("You are already in this group", 400);
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    if (existing) {
      return jsonError("User is already a member of this group", 409);
    }

    await prisma.groupMember.create({
      data: { groupId, userId: user.id },
    });

    await logActivity({
      groupId,
      activityType: "ADD_MEMBER",
      userId: session.userId,
      data: { memberName: user.name, memberEmail: user.email },
    });

    return NextResponse.json({ member: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
