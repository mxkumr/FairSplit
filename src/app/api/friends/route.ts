import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { createMutualFriendship } from "@/lib/friendship";
import { prisma } from "@/lib/prisma";
import { addFriendSchema } from "@/lib/validations/friend";

export async function GET() {
  try {
    const session = await requireSession();

    const friendships = await prisma.friendship.findMany({
      where: { userId: session.userId },
      include: {
        friend: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      friends: friendships.map((f) => ({
        id: f.id,
        friend: f.friend,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = addFriendSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const friend = await prisma.user.findUnique({
      where: { email: parsed.data.email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!friend) {
      return jsonError("No user found with that email", 404);
    }

    try {
      const result = await createMutualFriendship(session.userId, friend.id);
      if (!result.created) {
        return jsonError("Already friends", 409);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SELF_FRIEND") {
        return jsonError("You cannot add yourself as a friend", 400);
      }
      throw error;
    }

    const friendship = await prisma.friendship.findFirstOrThrow({
      where: { userId: session.userId, friendId: friend.id },
      include: { friend: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(
      {
        friend: friendship.friend,
        createdAt: friendship.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
