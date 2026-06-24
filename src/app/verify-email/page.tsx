"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFooterLink, AuthLayout } from "@/components/layout/AuthLayout";
import { api } from "@/lib/api-client";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const paramEmail = searchParams.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
    }
    const devCode = searchParams.get("devCode");
    if (devCode) {
      setInfo(`Dev code: ${devCode}`);
      setCode(devCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      await api.verifyEmail({ email, code });
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResendLoading(true);

    try {
      const result = await api.resendOtp({ email });
      setInfo(result.message);
      if (result.devCode) {
        setInfo(`Dev code: ${result.devCode}`);
      }
      setResendCooldown(60);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend code";
      if (message.includes("wait")) {
        const match = message.match(/(\d+)/);
        if (match) setResendCooldown(Number(match[1]));
      }
      setError(message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox"
      footer={
        <>
          Wrong email? <AuthFooterLink href="/register">Register again</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-muted-foreground">{info}</p>}
        <Button type="submit" variant="brand" className="w-full" size="lg" disabled={loading}>
          {loading ? "Verifying..." : "Verify email"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resendLoading || resendCooldown > 0 || !email}
          onClick={handleResend}
        >
          {resendLoading
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
