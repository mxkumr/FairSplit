import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
