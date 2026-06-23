"use client";

import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { BalanceResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RawBalancesTab({ balances }: { balances: BalanceResponse }) {
  if (balances.debts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          All settled up! No outstanding debts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Raw pairwise debts before simplification.
      </p>
      {balances.debts.map((debt) => (
        <Card key={`${debt.fromUserId}-${debt.toUserId}`}>
          <CardContent className="flex items-center gap-3 py-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(debt.fromUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{debt.fromUser.name}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(debt.toUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium flex-1">{debt.toUser.name}</span>
            <Badge variant="warning">{formatCents(debt.amount)}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
