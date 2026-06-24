import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function logActivity(params: {
  groupId: string;
  activityType: ActivityType;
  userId?: string;
  expenseId?: string;
  data?: Record<string, unknown>;
}) {
  await prisma.activity.create({
    data: {
      groupId: params.groupId,
      activityType: params.activityType,
      userId: params.userId,
      expenseId: params.expenseId,
      data: params.data ? JSON.stringify(params.data) : undefined,
    },
  });
}

export function getGroupActivities(groupId: string) {
  return prisma.activity.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
