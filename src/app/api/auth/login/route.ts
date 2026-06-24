import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

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
