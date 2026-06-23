import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
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

    const { description, amount, paidByUserId, splits } = parsed.data;

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = new Set(members.map((m) => m.userId));

    if (!memberIds.has(paidByUserId)) {
      return jsonError("Payer must be a group member", 400);
    }

    for (const split of splits) {
      if (!memberIds.has(split.userId)) {
        return jsonError("All split users must be group members", 400);
      }
    }

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          groupId,
          description,
          amount,
          paidByUserId,
          splits: {
            create: splits.map((s) => ({
              userId: s.userId,
              amountOwed: s.amountOwed,
            })),
          },
        },
      });

      return tx.expense.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          paidBy: { select: { id: true, name: true, email: true } },
          splits: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });

    return NextResponse.json(
      {
        expense: {
          ...expense,
          createdAt: expense.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
