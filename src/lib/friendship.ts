import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function createMutualFriendship(
  userId: string,
  friendId: string,
  db: DbClient = prisma,
) {
  if (userId === friendId) {
    throw new Error("SELF_FRIEND");
  }

  const existing = await db.friendship.findUnique({
    where: { userId_friendId: { userId, friendId } },
  });

  if (existing) {
    return { created: false as const };
  }

  await db.friendship.create({
    data: { userId, friendId },
  });
  await db.friendship.upsert({
    where: { userId_friendId: { userId: friendId, friendId: userId } },
    create: { userId: friendId, friendId: userId },
    update: {},
  });

  return { created: true as const };
}

export async function ensureFriendInviteToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { friendInviteToken: true },
  });

  if (user?.friendInviteToken) {
    return user.friendInviteToken;
  }

  const { generateInviteToken } = await import("@/lib/invite");
  const token = generateInviteToken();

  await prisma.user.update({
    where: { id: userId },
    data: { friendInviteToken: token },
  });

  return token;
}

export async function ensureGroupInviteToken(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { inviteToken: true },
  });

  if (group?.inviteToken) {
    return group.inviteToken;
  }

  const { generateInviteToken } = await import("@/lib/invite");
  const token = generateInviteToken();

  await prisma.group.update({
    where: { id: groupId },
    data: { inviteToken: token },
  });

  return token;
}
