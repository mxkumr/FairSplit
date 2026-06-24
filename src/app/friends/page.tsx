"use client";

import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/layout/AppShell";
import { useAddFriend, useFriends, useRemoveFriend } from "@/hooks/use-api";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FriendsPage() {
  const { data, isLoading } = useFriends();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <div>
          <p className="text-sm text-muted-foreground">Your network</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Friends</h1>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft border border-border sm:p-6">
          <h2 className="font-bold">Add a friend</h2>
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
