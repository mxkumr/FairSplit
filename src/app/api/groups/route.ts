import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { getCurrencySymbol } from "@/lib/currencies";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations/group";

export async function GET() {
  try {
    const session = await requireSession();

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, expenses: true } },
          },
        },
      },
      orderBy: [
        { isFavorite: "desc" },
        { group: { updatedAt: "desc" } },
      ],
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      information: m.group.information,
      currency: m.group.currency,
      currencySymbol: m.group.currencySymbol,
      isFavorite: m.isFavorite,
      createdAt: m.group.createdAt.toISOString(),
      memberCount: m.group._count.members,
      _count: { expenses: m.group._count.expenses },
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const { name, information, currency, memberIds } = parsed.data;
    const currencySymbol = getCurrencySymbol(currency);
    const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== session.userId))];

    if (uniqueMemberIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: uniqueMemberIds } },
        select: { id: true },
      });
      if (users.length !== uniqueMemberIds.length) {
        return jsonError("One or more member IDs are invalid", 400);
      }
    }

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name,
          information,
          currency,
          currencySymbol,
          createdByUserId: session.userId,
          members: {
            create: [
              { userId: session.userId },
              ...uniqueMemberIds.map((userId) => ({ userId })),
            ],
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          expenses: {
            include: {
              paidBy: { select: { id: true, name: true, email: true } },
              category: { select: { id: true, grouping: true, name: true } },
              splits: {
                include: { user: { select: { id: true, name: true, email: true } } },
              },
              documents: true,
            },
          },
          payments: {
            include: {
              fromUser: { select: { id: true, name: true, email: true } },
              toUser: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      return created;
    });

    await logActivity({
      groupId: group.id,
      activityType: "CREATE_GROUP",
      userId: session.userId,
      data: { name: group.name },
    });

    const { serializeGroup } = await import("@/lib/serializers");
    return NextResponse.json({ group: serializeGroup(group) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
