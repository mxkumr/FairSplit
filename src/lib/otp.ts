import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode() {
  return randomInt(100000, 1_000_000).toString();
}

export async function createAndStoreOtp(email: string, purpose = "REGISTER") {
  const normalized = normalizeEmail(email);

  const recent = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
    );
    throw new Error(`RESEND_COOLDOWN:${waitSec}`);
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailOtp.deleteMany({ where: { email: normalized, purpose } });
  await prisma.emailOtp.create({
    data: {
      email: normalized,
      codeHash: hashCode(code),
      purpose,
      expiresAt,
    },
  });

  return code;
}

export async function verifyOtp(email: string, code: string, purpose = "REGISTER") {
  const normalized = normalizeEmail(email);
  const record = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailOtp.delete({ where: { id: record.id } });
    return { ok: false as const, reason: "expired" as const };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { id: record.id } });
    return { ok: false as const, reason: "max_attempts" as const };
  }

  const valid = record.codeHash === hashCode(code.trim());

  if (!valid) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, reason: "invalid" as const };
  }

  await prisma.emailOtp.delete({ where: { id: record.id } });
  return { ok: true as const };
}
