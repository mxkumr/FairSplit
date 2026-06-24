import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { ensureGroupInviteToken } from "@/lib/friendship";
import { buildGroupInviteUrl } from "@/lib/invite";
import { assertGroupMember } from "@/lib/groups";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { groupId } = await context.params;
    await assertGroupMember(groupId, session.userId);

    const token = await ensureGroupInviteToken(groupId);

    return NextResponse.json({
      token,
      url: buildGroupInviteUrl(token, request),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
