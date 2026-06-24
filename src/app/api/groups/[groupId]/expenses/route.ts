import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { createRecurringLink } from "@/lib/recurring";
import { expenseInclude, serializeExpense } from "@/lib/serializers";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations/expense";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const data = parsed.data;
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = new Set(members.map((m) => m.userId));

    if (!memberIds.has(data.paidByUserId)) {
      return jsonError("Payer must be a group member", 400);
    }

    for (const split of data.splits) {
      if (!memberIds.has(split.userId)) {
        return jsonError("All split users must be group members", 400);
      }
    }

    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          groupId,
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
        include: expenseInclude,
      });
      return created;
    });

    if (data.recurrenceRule !== "NONE") {
      await createRecurringLink(expense.id, groupId, data.recurrenceRule, expenseDate);
    }

    await logActivity({
      groupId,
      activityType: "CREATE_EXPENSE",
      userId: session.userId,
      expenseId: expense.id,
      data: { description: expense.description, amount: expense.amount },
    });

    return NextResponse.json({ expense: serializeExpense(expense) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
