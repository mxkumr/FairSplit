"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserMinus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteLinkField } from "@/components/invites/InviteLinkField";
import { AppShell } from "@/components/layout/AppShell";
import { useAddFriend, useFriendInvite, useFriends, useLogout, useMe, useRemoveFriend } from "@/hooks/use-api";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FriendsPage() {
  const router = useRouter();
  const { data: meData } = useMe();
  const { data, isLoading } = useFriends();
  const { data: inviteData } = useFriendInvite();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();
  const logout = useLogout();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addFriend.mutateAsync({ email });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {meData?.user && (
          <div className="rounded-3xl bg-card p-5 shadow-soft border border-border sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {getInitials(meData.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold truncate">{meData.user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{meData.user.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logout.isPending ? "Signing out..." : "Log out"}
            </Button>
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground">Your network</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Friends</h1>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft border border-border sm:p-6">
          <h2 className="font-bold">Share your friend link</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send this link so people can add you as a friend on FairSplit
          </p>
          {inviteData?.url ? (
            <div className="mt-4">
              <InviteLinkField url={inviteData.url} label="Your friend link" />
            </div>
          ) : (
            <div className="mt-4 h-10 animate-pulse rounded-lg bg-muted" />
          )}
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft border border-border sm:p-6">
          <h2 className="font-bold">Add a friend by email</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter their FairSplit email address</p>
          <form onSubmit={handleAdd} className="mt-4 flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="brand" disabled={addFriend.isPending}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.friends.length === 0 ? (
              <div className="rounded-3xl bg-card py-12 text-center shadow-soft border border-border text-muted-foreground">
                No friends yet. Add someone by email above.
              </div>
            ) : (
              data?.friends.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft border border-border"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(item.friend.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.friend.name}</p>
                    <p className="text-sm text-muted-foreground">{item.friend.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFriend.mutate(item.friend.id)}
                    disabled={removeFriend.isPending}
                    aria-label="Remove friend"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
