"use client";

import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { SettlementResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SettleUpTab({ settlements }: { settlements: SettlementResponse }) {
  if (settlements.settlements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          All settled up! No payments needed.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Minimum transactions to settle the group.
        </p>
        <Badge variant="secondary">{settlements.transactionCount} payments</Badge>
      </div>
      {settlements.settlements.map((s) => (
        <Card key={`${s.fromUserId}-${s.toUserId}`}>
          <CardContent className="flex items-center gap-3 py-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(s.fromUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{s.fromUser.name}</span>
            <span className="text-xs text-muted-foreground">pays</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(s.toUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium flex-1">{s.toUser.name}</span>
            <div className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="default">{formatCents(s.amount)}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
