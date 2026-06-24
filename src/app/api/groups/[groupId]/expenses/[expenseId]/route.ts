import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { expenseInclude, serializeExpense } from "@/lib/serializers";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validations/expense";

type RouteContext = { params: Promise<{ groupId: string; expenseId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, expenseId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, groupId },
    });

    if (!existing) {
      return jsonError("Expense not found", 404);
    }

    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const data = parsed.data;
    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : existing.expenseDate;

    const expense = await prisma.$transaction(async (tx) => {
      await tx.expenseSplit.deleteMany({ where: { expenseId } });
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: data.description,
          amount: data.amount,
          paidByUserId: data.paidByUserId,
          categoryId: data.categoryId ?? null,
          splitMode: data.splitMode,
          notes: data.notes,
          isReimbursement: data.isReimbursement,
          recurrenceRule: data.recurrenceRule,
          expenseDate,
          splits: {
            create: data.splits.map((s) => ({
              userId: s.userId,
              amountOwed: s.amountOwed,
              shares: s.shares ?? 1,
            })),
          },
        },
      });

      return tx.expense.findUniqueOrThrow({
        where: { id: expenseId },
        include: expenseInclude,
      });
    });

    await logActivity({
      groupId,
      activityType: "UPDATE_EXPENSE",
      userId: session.userId,
      expenseId,
      data: { description: expense.description },
    });

    return NextResponse.json({ expense: serializeExpense(expense) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, expenseId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, groupId },
    });

    if (!existing) {
      return jsonError("Expense not found", 404);
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    await logActivity({
      groupId,
      activityType: "DELETE_EXPENSE",
      userId: session.userId,
      expenseId,
      data: { description: existing.description },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
