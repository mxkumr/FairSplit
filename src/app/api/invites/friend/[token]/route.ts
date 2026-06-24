import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    const user = await prisma.user.findUnique({
      where: { friendInviteToken: token },
      select: { id: true, name: true },
    });

    if (!user) {
      return jsonError("Invite link is invalid", 404);
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
