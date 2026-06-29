import { NextResponse } from "next/server";
import type { ActivityType } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { computeGroupBalances } from "@/lib/balances";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { assertGroupMember, getGroupBalanceData } from "@/lib/groups";
import { validatePaymentAmount } from "@/lib/payment-validation";
import { prisma } from "@/lib/prisma";
import { updatePaymentSchema } from "@/lib/validations/group";

type RouteContext = { params: Promise<{ groupId: string; paymentId: string }> };

const paymentInclude = {
  fromUser: { select: { id: true, name: true, email: true } },
  toUser: { select: { id: true, name: true, email: true } },
} as const;

function serializePayment(payment: {
  id: string;
  amount: number;
  note: string | null;
  createdAt: Date;
  fromUser: { id: string; name: string; email: string };
  toUser: { id: string; name: string; email: string };
}) {
  return {
    ...payment,
    createdAt: payment.createdAt.toISOString(),
  };
}

async function getPaymentOrError(groupId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, groupId },
    include: paymentInclude,
  });

  if (!payment) {
    return { error: jsonError("Payment not found", 404) };
  }

  return { payment };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, paymentId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const found = await getPaymentOrError(groupId, paymentId);
    if ("error" in found) return found.error;
    const existing = found.payment;

    const body = await request.json();
    const parsed = updatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const nextAmount = parsed.data.amount ?? existing.amount;
    const nextNote =
      parsed.data.note !== undefined ? parsed.data.note : existing.note;

    const { expenses, payments } = await getGroupBalanceData(groupId);
    const otherPayments = payments.filter((payment) => payment.id !== paymentId);
    const { netBalances } = computeGroupBalances(expenses, otherPayments);

    const validationError = validatePaymentAmount(
      netBalances,
      existing.fromUserId,
      existing.toUserId,
      nextAmount,
    );
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: nextAmount,
        note: nextNote,
      },
      include: paymentInclude,
    });

    await logActivity({
      groupId,
      activityType: "UPDATE_PAYMENT" as ActivityType,
      userId: session.userId,
      data: {
        from: payment.fromUser.name,
        to: payment.toUser.name,
        amount: payment.amount,
      },
    });

    return NextResponse.json({ payment: serializePayment(payment) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId, paymentId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const found = await getPaymentOrError(groupId, paymentId);
    if ("error" in found) return found.error;
    const existing = found.payment;

    await prisma.payment.delete({ where: { id: paymentId } });

    await logActivity({
      groupId,
      activityType: "DELETE_PAYMENT" as ActivityType,
      userId: session.userId,
      data: {
        from: existing.fromUser.name,
        to: existing.toUser.name,
        amount: existing.amount,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
