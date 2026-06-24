import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { ensureFriendInviteToken } from "@/lib/friendship";
import { buildFriendInviteUrl } from "@/lib/invite";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const token = await ensureFriendInviteToken(session.userId);

    return NextResponse.json({
      token,
      url: buildFriendInviteUrl(token, request),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
