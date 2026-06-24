import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ friendId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { friendId } = await context.params;

    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: { userId: session.userId, friendId },
      },
    });

    if (!friendship) {
      return jsonError("Friend not found", 404);
    }

    await prisma.$transaction([
      prisma.friendship.delete({
        where: { userId_friendId: { userId: session.userId, friendId } },
      }),
      prisma.friendship.deleteMany({
        where: { userId: friendId, friendId: session.userId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
