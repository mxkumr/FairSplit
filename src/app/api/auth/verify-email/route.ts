import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return jsonError("Invalid verification code", 400);
    }

    if (user.emailVerifiedAt) {
      return jsonError("Email already verified", 400);
    }

    const result = await verifyOtp(email, code);
    if (!result.ok) {
      const messages = {
        invalid: "Invalid verification code",
        expired: "Code expired. Request a new one.",
        max_attempts: "Too many attempts. Request a new code.",
      };
      return jsonError(messages[result.reason], 400);
    }

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, name: true, email: true },
    });

    await createSession({
      userId: verified.id,
      email: verified.email,
      name: verified.name,
    });

    return NextResponse.json({ user: verified });
  } catch (error) {
    return handleApiError(error);
  }
}
