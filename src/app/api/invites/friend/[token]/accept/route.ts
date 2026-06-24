import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { createMutualFriendship } from "@/lib/friendship";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { token } = await context.params;

    const user = await prisma.user.findUnique({
      where: { friendInviteToken: token },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return jsonError("Invite link is invalid", 404);
    }

    if (user.id === session.userId) {
      return jsonError("You cannot add yourself as a friend", 400);
    }

    const result = await createMutualFriendship(session.userId, user.id);

    return NextResponse.json({
      friend: user,
      alreadyFriends: !result.created,
      message: result.created ? `You are now friends with ${user.name}` : "Already friends",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
