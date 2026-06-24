import type { RecurrenceRule } from "@prisma/client";
import { prisma } from "./prisma";
import { logActivity } from "./activity";

function addInterval(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  switch (rule) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      break;
  }
  return next;
}

export async function processRecurringExpenses(groupId: string) {
  const now = new Date();
  const dueLinks = await prisma.recurringExpenseLink.findMany({
    where: {
      groupId,
      nextExpenseDate: { lte: now },
    },
    include: {
      expense: {
        include: { splits: true },
      },
    },
  });

  for (const link of dueLinks) {
    const template = link.expense;
    if (template.recurrenceRule === "NONE") continue;

    const newExpense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          groupId: template.groupId,
          description: template.description,
          amount: template.amount,
          paidByUserId: template.paidByUserId,
          categoryId: template.categoryId,
          splitMode: template.splitMode,
          notes: template.notes,
          isReimbursement: template.isReimbursement,
          recurrenceRule: "NONE",
          expenseDate: link.nextExpenseDate,
          splits: {
            create: template.splits.map((s) => ({
              userId: s.userId,
              amountOwed: s.amountOwed,
              shares: s.shares,
            })),
          },
        },
      });

      const nextDate = addInterval(link.nextExpenseDate, template.recurrenceRule);

      await tx.recurringExpenseLink.update({
        where: { id: link.id },
        data: {
          currentFrameExpenseId: created.id,
          nextExpenseCreatedAt: now,
          nextExpenseDate: nextDate,
        },
      });

      return created;
    });

    await logActivity({
      groupId,
      activityType: "CREATE_EXPENSE",
      expenseId: newExpense.id,
      data: { recurring: true, description: newExpense.description },
    });
  }
}

export async function createRecurringLink(
  expenseId: string,
  groupId: string,
  recurrenceRule: RecurrenceRule,
  expenseDate: Date,
) {
  if (recurrenceRule === "NONE") return;

  const nextDate = addInterval(expenseDate, recurrenceRule);
  await prisma.recurringExpenseLink.create({
    data: {
      groupId,
      currentFrameExpenseId: expenseId,
      nextExpenseDate: nextDate,
    },
  });
}
