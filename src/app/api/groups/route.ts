import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
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
      orderBy: { group: { updatedAt: "desc" } },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
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

    const { name, memberIds } = parsed.data;
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
          createdByUserId: session.userId,
          members: {
            create: [
              { userId: session.userId },
              ...uniqueMemberIds.map((userId) => ({ userId })),
            ],
          },
        },
      });

      return tx.group.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          expenses: {
            include: {
              paidBy: { select: { id: true, name: true, email: true } },
              splits: {
                include: { user: { select: { id: true, name: true, email: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    return NextResponse.json(
      {
        group: {
          ...group,
          createdAt: group.createdAt.toISOString(),
          expenses: group.expenses.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
