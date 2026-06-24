"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRound } from "lucide-react";
import { AuthFooterLink, AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useMe } from "@/hooks/use-api";

function AddFriendContent({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: meData, isLoading: meLoading } = useMe();
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.getFriendInvitePreview>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const next = searchParams.get("next") ?? `/add-friend/${token}`;

  useEffect(() => {
    api
      .getFriendInvitePreview(token)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid invite link"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      await api.acceptFriendInvite(token);
      router.push("/friends");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add friend");
    } finally {
      setAccepting(false);
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

  const user = preview?.user;

  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-brand-foreground">
        <UserRound className="h-7 w-7" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Add as a friend on FairSplit</p>
        <h2 className="text-2xl font-bold">{user?.name}</h2>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {meData?.user ? (
        <Button
          className="w-full"
          size="lg"
          variant="brand"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? "Adding..." : "Add friend"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button className="w-full" size="lg" variant="brand" asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to add friend</Link>
          </Button>
          <Button className="w-full" size="lg" variant="outline" asChild>
            <Link href={`/register?next=${encodeURIComponent(next)}`}>Create account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AddFriendPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  if (!token) {
    return <div className="min-h-screen" />;
  }

  return (
    <AuthLayout
      title="Friend invite"
      subtitle="Connect on FairSplit"
      footer={
        <>
          <AuthFooterLink href="/">Back to home</AuthFooterLink>
        </>
      }
    >
      <Suspense fallback={<div className="min-h-[40vh] animate-pulse rounded-3xl bg-muted" />}>
        <AddFriendContent token={token} />
      </Suspense>
    </AuthLayout>
  );
}
