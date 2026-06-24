"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FairSplitLogoMark } from "@/components/brand/FairSplitLogo";
import { AuthFooterLink, AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useMe } from "@/hooks/use-api";

function JoinGroupContent({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: meData, isLoading: meLoading } = useMe();
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.getGroupInvitePreview>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const next = searchParams.get("next") ?? `/join/${token}`;

  useEffect(() => {
    api
      .getGroupInvitePreview(token)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid invite link"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const result = await api.joinGroupViaInvite(token);
      router.push(`/groups/${result.groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join group");
    } finally {
      setJoining(false);
    }
  }

  if (loading || meLoading) {
    return <div className="min-h-[40vh] animate-pulse rounded-3xl bg-muted" />;
  }

  if (error && !preview) {
    return (
      <div className="text-center space-y-4">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const group = preview?.group;

  return (
    <div className="space-y-6">
      <FairSplitLogoMark size="xl" className="mx-auto shadow-float" />
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">You are invited to join</p>
        <h2 className="text-2xl font-bold">{group?.name}</h2>
        {group?.information && (
          <p className="text-sm text-muted-foreground">{group.information}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {group?.memberCount} members · Created by {group?.createdByName}
        </p>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {meData?.user ? (
        <Button className="w-full" size="lg" variant="brand" onClick={handleJoin} disabled={joining}>
          {joining ? "Joining..." : "Join group"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button className="w-full" size="lg" variant="brand" asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to join</Link>
          </Button>
          <Button className="w-full" size="lg" variant="outline" asChild>
            <Link href={`/register?next=${encodeURIComponent(next)}`}>Create account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  if (!token) {
    return <div className="min-h-screen" />;
  }

  return (
    <AuthLayout
      title="Group invite"
      subtitle="Join your friends on FairSplit"
      footer={
        <>
          <AuthFooterLink href="/">Back to home</AuthFooterLink>
        </>
      }
    >
      <Suspense fallback={<div className="min-h-[40vh] animate-pulse rounded-3xl bg-muted" />}>
        <JoinGroupContent token={token} />
      </Suspense>
    </AuthLayout>
  );
}
