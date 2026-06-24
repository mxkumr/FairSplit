"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGroup, useFriends } from "@/hooks/use-api";

export default function NewGroupPage() {
  const router = useRouter();
  const { data: friendsData } = useFriends();
  const [name, setName] = useState("");
  const [information, setInformation] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const createGroup = useCreateGroup();

  function toggleFriend(friendId: string) {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const result = await createGroup.mutateAsync({
        name: name.trim(),
        information: information.trim() || undefined,
        currency,
        currencySymbol,
        memberIds: selectedFriendIds,
      });
      router.push(`/groups/${result.group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Start splitting</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Create Group</h1>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft border border-border/50 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Group name</Label>
              <Input
                id="name"
                placeholder="e.g. Roommates, Trip to NYC"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="information">Description (optional)</Label>
              <Input
                id="information"
                placeholder="e.g. Summer vacation 2025"
                value={information}
                onChange={(e) => setInformation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelect
                id="currency"
                value={currency}
                onChange={(code, symbol) => {
                  setCurrency(code);
                  setCurrencySymbol(symbol);
                }}
              />
            </div>

            {friendsData && friendsData.friends.length > 0 && (
              <div className="space-y-2">
                <Label>Add friends (optional)</Label>
                <div className="space-y-2 rounded-2xl bg-muted/50 p-3">
                  {friendsData.friends.map((item) => (
                    <label
                      key={item.friend.id}
                      className="flex items-center gap-3 cursor-pointer min-h-11 rounded-xl px-2 hover:bg-accent/80"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.includes(item.friend.id)}
                        onChange={() => toggleFriend(item.friend.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">
                        {item.friend.name}{" "}
                        <span className="text-muted-foreground">({item.friend.email})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="brand" className="w-full" size="lg" disabled={createGroup.isPending}>
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
