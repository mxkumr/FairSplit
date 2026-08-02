import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("terminating connection") ||
      message.includes("can't reach database") ||
      message.includes("connection reset") ||
      message.includes("connection timed out") ||
      message.includes("server has closed the connection")
    );
  }
  return false;
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
  if (error instanceof Error && error.message === "JWT_SECRET environment variable is not set") {
    console.error(error);
    return jsonError("Server auth is misconfigured", 500);
  }
  if (isTransientDbError(error)) {
    console.error(error);
    return jsonError("Database temporarily unavailable. Please try again.", 503);
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}
