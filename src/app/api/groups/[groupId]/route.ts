import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
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

    if (!group) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json({
      group: {
        ...group,
        createdAt: group.createdAt.toISOString(),
        expenses: group.expenses.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
