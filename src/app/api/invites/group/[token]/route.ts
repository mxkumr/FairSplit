import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    const group = await prisma.group.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        name: true,
        information: true,
        currency: true,
        createdBy: { select: { name: true } },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return jsonError("Invite link is invalid or expired", 404);
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        information: group.information,
        currency: group.currency,
        memberCount: group._count.members,
        createdByName: group.createdBy.name,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
