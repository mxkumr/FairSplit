import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { assertGroupMember } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId } },
    });

    if (!membership) {
      throw new Error("FORBIDDEN");
    }

    await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: session.userId } },
      data: { isFavorite: !membership.isFavorite },
    });

    return NextResponse.json({ isFavorite: !membership.isFavorite });
  } catch (error) {
    return handleApiError(error);
  }
}
