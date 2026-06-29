import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { computeGroupBalances } from "@/lib/balances";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validations/group";
import { validatePaymentAmount } from "@/lib/payment-validation";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const payments = await prisma.payment.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const { fromUserId, toUserId, amount, note } = parsed.data;

    if (fromUserId === toUserId) {
      return jsonError("Payer and recipient must be different", 400);
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = new Set(members.map((m) => m.userId));

    if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) {
      return jsonError("Both users must be group members", 400);
    }

    const { expenses, payments: existingPayments } = await getGroupBalanceData(groupId);
    const { netBalances } = computeGroupBalances(expenses, existingPayments);

    const validationError = validatePaymentAmount(
      netBalances,
      fromUserId,
      toUserId,
      amount,
    );
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const payment = await prisma.payment.create({
      data: { groupId, fromUserId, toUserId, amount, note },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      groupId,
      activityType: "CREATE_PAYMENT",
      userId: session.userId,
      data: {
        from: payment.fromUser.name,
        to: payment.toUser.name,
        amount: payment.amount,
      },
    });

    return NextResponse.json(
      {
        payment: {
          ...payment,
          createdAt: payment.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
