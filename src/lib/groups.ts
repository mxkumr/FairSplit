import { prisma } from "./prisma";

const userSelect = { id: true, name: true, email: true } as const;

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
      paidBy: { select: userSelect },
      splits: {
        include: { user: { select: userSelect } },
      },
    },
    orderBy: { expenseDate: "desc" },
  });
}

export async function getGroupPaymentsForBalances(groupId: string) {
  return prisma.payment.findMany({
    where: { groupId },
    include: {
      fromUser: { select: userSelect },
      toUser: { select: userSelect },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGroupBalanceData(groupId: string) {
  const [expenses, payments] = await Promise.all([
    getGroupExpensesForBalances(groupId),
    getGroupPaymentsForBalances(groupId),
  ]);
  return { expenses, payments };
}
