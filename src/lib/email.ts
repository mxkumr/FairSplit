import { Resend } from "resend";

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "FairSplit <onboarding@resend.dev>";
}

export async function sendVerificationOtp(email: string, code: string) {
  const subject = `${code} is your FairSplit verification code`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="margin-bottom: 8px;">Verify your email</h2>
      <p style="color: #555;">Enter this code in FairSplit to finish creating your account:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">${code}</p>
      <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you did not sign up, you can ignore this email.</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log(`[dev] OTP for ${email}: ${code}`);
    return { dev: true as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Failed to send verification email");
  }

  return { dev: false as const };
}
