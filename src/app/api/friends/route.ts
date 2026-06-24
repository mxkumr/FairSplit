import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
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
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true },
    });

    if (!friend) {
      return jsonError("No user found with that email", 404);
    }

    if (friend.id === session.userId) {
      return jsonError("You cannot add yourself as a friend", 400);
    }

    const existing = await prisma.friendship.findUnique({
      where: {
        userId_friendId: { userId: session.userId, friendId: friend.id },
      },
    });

    if (existing) {
      return jsonError("Already friends", 409);
    }

    const friendship = await prisma.$transaction(async (tx) => {
      await tx.friendship.create({
        data: { userId: session.userId, friendId: friend.id },
      });
      await tx.friendship.upsert({
        where: {
          userId_friendId: { userId: friend.id, friendId: session.userId },
        },
        create: { userId: friend.id, friendId: session.userId },
        update: {},
      });
      return tx.friendship.findFirstOrThrow({
        where: { userId: session.userId, friendId: friend.id },
        include: { friend: { select: { id: true, name: true, email: true } } },
      });
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
