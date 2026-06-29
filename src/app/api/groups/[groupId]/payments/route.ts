import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { computeGroupBalances } from "@/lib/balances";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validations/group";

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

    const payerNet = netBalances.find((balance) => balance.userId === fromUserId)?.amount ?? 0;
    const recipientNet =
      netBalances.find((balance) => balance.userId === toUserId)?.amount ?? 0;

    if (payerNet >= 0) {
      return jsonError("Payer has no outstanding debt in this group", 400);
    }

    if (recipientNet <= 0) {
      return jsonError("Recipient is not owed money in this group", 400);
    }

    const maxPayerAmount = Math.abs(payerNet);
    if (amount > maxPayerAmount) {
      return jsonError(`Payment exceeds payer net debt of ${maxPayerAmount} cents`, 400);
    }

    if (amount > recipientNet) {
      return jsonError(`Payment exceeds recipient net credit of ${recipientNet} cents`, 400);
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
