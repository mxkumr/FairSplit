"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import type { BalanceResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MemberBalances({
  balances,
  currentUserId,
}: {
  balances: BalanceResponse;
  currentUserId: string;
}) {
  const { currencySymbol } = useGroupCurrency();
  const members = new Map<string, { name: string; amount: number }>();

  for (const entry of balances.netBalances) {
    members.set(entry.userId, { name: entry.user.name, amount: entry.amount });
  }

  const currentUserNet = members.get(currentUserId)?.amount ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {balances.netBalances.map((entry) => {
        const isYou = entry.userId === currentUserId;
        return (
          <Card key={entry.userId}>
            <CardContent className="flex items-center gap-3 py-4">
              <Avatar>
                <AvatarFallback>{getInitials(entry.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {entry.user.name}
                  {isYou && <span className="text-muted-foreground"> (you)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.amount > 0
                    ? "gets back"
                    : entry.amount < 0
                      ? "owes"
                      : "settled up"}
                </p>
              </div>
              {entry.amount !== 0 && (
                <Badge variant={entry.amount > 0 ? "success" : "warning"}>
                  {formatCents(Math.abs(entry.amount), currencySymbol)}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
      {balances.netBalances.length === 0 && (
        <Card className="sm:col-span-2">
          <CardContent className="py-6 text-center text-muted-foreground">
            Everyone is settled up in this group.
          </CardContent>
        </Card>
      )}
      {currentUserNet !== 0 && balances.netBalances.length > 0 && (
        <p className="sm:col-span-2 text-xs text-muted-foreground">
          Your net balance in this group:{" "}
          <span className="font-medium">
            {currentUserNet > 0
              ? `+${formatCents(currentUserNet, currencySymbol)}`
              : formatCents(currentUserNet, currencySymbol)}
          </span>
        </p>
      )}
    </div>
  );
}
