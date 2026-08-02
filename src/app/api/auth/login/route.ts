import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

function isLikelyConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("terminating connection") ||
    message.includes("can't reach database") ||
    message.includes("connection") ||
    message.includes("timed out") ||
    message.includes("p1001") ||
    message.includes("p1017")
  );
}

async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (!isLikelyConnectionError(error)) throw error;
    // Supabase/pgbouncer sometimes kills idle connections; one reconnect usually clears it.
    await prisma.$connect();
    return prisma.user.findUnique({ where: { email } });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body", 400);
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { password } = parsed.data;
    const user = await findUserByEmail(email);

    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return jsonError("Invalid email or password", 401);
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email not verified", code: "EMAIL_NOT_VERIFIED", email: user.email },
        { status: 403 },
      );
    }

    await createSession({ userId: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
