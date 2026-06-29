"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGoToSettleUpTab } from "@/components/groups/group-tab-context";
import { formatCents } from "@/lib/money";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import type { SettlementResponse } from "@/lib/api-client";

export function SimplifiedDebtsBanner({
  settlements,
  groupId,
}: {
  settlements: SettlementResponse;
  groupId: string;
}) {
  const { currencySymbol } = useGroupCurrency();
  const goToSettleUp = useGoToSettleUpTab();

  if (settlements.settlements.length === 0) {
    return null;
  }

  const { rawDebtCount, transactionCount, paymentsSaved } = settlements;

  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand/5 to-transparent">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold">Simplified debts</h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
              Instead of {rawDebtCount} individual payment{rawDebtCount === 1 ? "" : "s"} between
              members, you only need{" "}
              <span className="font-semibold text-foreground">{transactionCount}</span> to settle
              everyone up.
              {paymentsSaved > 0 && (
                <>
                  {" "}
                  That saves{" "}
                  <span className="font-semibold text-brand">
                    {paymentsSaved} transaction{paymentsSaved === 1 ? "" : "s"}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
          <Badge className="shrink-0 border-transparent bg-brand text-brand-foreground">
            {transactionCount} payment{transactionCount === 1 ? "" : "s"}
          </Badge>
        </div>

        <ul className="mt-4 space-y-2">
          {settlements.settlements.slice(0, 3).map((s) => (
            <li
              key={`${s.fromUserId}-${s.toUserId}`}
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-card/80 px-3 py-2 text-sm border border-border/60"
            >
              <span className="font-medium">{s.fromUser.name}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{s.toUser.name}</span>
              <span className="ml-auto font-semibold text-brand">
                {formatCents(s.amount, currencySymbol)}
              </span>
            </li>
          ))}
        </ul>

        {settlements.settlements.length > 3 && (
          <p className="mt-2 text-xs text-muted-foreground">
            + {settlements.settlements.length - 3} more payment
            {settlements.settlements.length - 3 === 1 ? "" : "s"}
          </p>
        )}

        <Button variant="brand" size="sm" className="mt-4" onClick={goToSettleUp}>
          View all & record payments
        </Button>
      </CardContent>
    </Card>
  );
}
