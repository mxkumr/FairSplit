import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationOtp } from "@/lib/email";
import { createAndStoreOtp } from "@/lib/otp";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing?.emailVerifiedAt) {
      return jsonError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, passwordHash },
          select: { id: true, name: true, email: true },
        })
      : await prisma.user.create({
          data: { name, email: normalizedEmail, passwordHash },
          select: { id: true, name: true, email: true },
        });

    const code = await createAndStoreOtp(normalizedEmail);
    const sendResult = await sendVerificationOtp(normalizedEmail, code);

    return NextResponse.json(
      {
        needsVerification: true,
        email: user.email,
        message: "Verification code sent to your email",
        ...(sendResult.dev && process.env.NODE_ENV !== "production"
          ? { devCode: code }
          : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
