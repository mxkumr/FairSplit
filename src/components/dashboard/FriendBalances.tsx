"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import type { DashboardBalances } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function FriendBalances({ balances }: { balances: DashboardBalances }) {
  if (!balances.friends || balances.friends.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold">Friend Balances</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {balances.friends.map((friend) => (
          <div
            key={friend.userId}
            className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft border border-border/50"
          >
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {getInitials(friend.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{friend.name}</p>
              <p className="truncate text-xs text-muted-foreground">{friend.email}</p>
            </div>
            <Badge variant={friend.netAmount > 0 ? "success" : "warning"}>
              {friend.netAmount > 0
                ? `owes you ${formatCents(friend.netAmount)}`
                : `you owe ${formatCents(Math.abs(friend.netAmount))}`}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
