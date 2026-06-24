import { NextResponse } from "next/server";
import { sendVerificationOtp } from "@/lib/email";
import { createAndStoreOtp } from "@/lib/otp";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { resendOtpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({
        message: "If an unverified account exists, a new code was sent.",
      });
    }

    const code = await createAndStoreOtp(email);
    const sendResult = await sendVerificationOtp(email, code);

    return NextResponse.json({
      message: "Verification code sent",
      ...(sendResult.dev && process.env.NODE_ENV !== "production"
        ? { devCode: code }
        : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
