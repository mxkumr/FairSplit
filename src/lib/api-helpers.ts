import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return jsonError("Unauthorized", 401);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return jsonError("Forbidden", 403);
  }
  if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
    return jsonError("Email not verified", 403);
  }
  if (error instanceof Error && error.message.startsWith("RESEND_COOLDOWN:")) {
    const seconds = error.message.split(":")[1];
    return jsonError(`Please wait ${seconds} seconds before requesting a new code`, 429);
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return jsonError("Not found", 404);
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}
