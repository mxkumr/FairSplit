import { prisma } from "./prisma";

export async function assertGroupMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }
}

export async function getGroupExpensesForBalances(groupId: string) {
  return prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
