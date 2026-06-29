"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { formatCents } from "@/lib/money";
import type { BalanceResponse, SettlementResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function YourSettleUpBanner({
  groupId,
  currentUserId,
  balances,
  settlements,
  isLoading,
}: {
  groupId: string;
  currentUserId: string;
  balances?: BalanceResponse;
  settlements?: SettlementResponse;
  isLoading?: boolean;
}) {
  const { currencySymbol } = useGroupCurrency();

  if (isLoading) {
    return (
      <div className="h-28 animate-pulse rounded-3xl bg-muted" aria-hidden />
    );
  }

  if (!balances || !settlements) {
    return null;
  }

  const net = balances.netBalances.find((b) => b.userId === currentUserId)?.amount ?? 0;
  const youPay = settlements.settlements.filter((s) => s.fromUserId === currentUserId);
  const youReceive = settlements.settlements.filter((s) => s.toUserId === currentUserId);
  const totalYouPay = youPay.reduce((sum, s) => sum + s.amount, 0);
  const totalYouReceive = youReceive.reduce((sum, s) => sum + s.amount, 0);

  if (net === 0 && youPay.length === 0 && youReceive.length === 0) {
    return (
      <Card className="border-success/30 bg-gradient-to-br from-success-muted/40 to-transparent">
        <CardContent className="flex items-center gap-3 p-5 sm:p-6">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success-foreground">You&apos;re all settled up</p>
            <p className="text-sm text-muted-foreground">No payments needed from you in this group.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand/8 to-transparent">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your settle up
              </p>
              {totalYouPay > 0 ? (
                <>
                  <p className="mt-1 text-xl font-bold text-brand sm:text-2xl">
                    Pay {formatCents(totalYouPay, currencySymbol)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {youPay.length === 1
                      ? "1 person to pay in this group"
                      : `${youPay.length} people to pay in this group`}
                  </p>
                </>
              ) : net > 0 ? (
                <>
                  <p className="mt-1 text-xl font-bold text-success sm:text-2xl">
                    You get back {formatCents(net, currencySymbol)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Others owe you in this group
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Your net balance: {formatCents(net, currencySymbol)}
                </p>
              )}
            </div>
          </div>
          <Button variant="brand" size="sm" className="shrink-0" asChild>
            <Link href={`/groups/${groupId}?tab=settle`}>Settle up</Link>
          </Button>
        </div>

        {youPay.length > 0 && (
          <ul className="mt-4 space-y-2">
            {youPay.map((s) => (
              <li
                key={`${s.fromUserId}-${s.toUserId}`}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5"
              >
                <span className="text-sm text-muted-foreground shrink-0">Pay</span>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs font-bold">
                    {getInitials(s.toUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate flex-1 min-w-0">{s.toUser.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <span className="text-sm font-bold text-brand shrink-0">
                  {formatCents(s.amount, currencySymbol)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {youPay.length === 0 && youReceive.length > 0 && (
          <ul className="mt-4 space-y-2">
            {youReceive.map((s) => (
              <li
                key={`${s.fromUserId}-${s.toUserId}`}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs font-bold">
                    {getInitials(s.fromUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate flex-1 min-w-0">
                  {s.fromUser.name}
                </span>
                <span className="text-sm text-muted-foreground shrink-0">owes you</span>
                <span className="text-sm font-bold text-success shrink-0">
                  {formatCents(s.amount, currencySymbol)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {totalYouPay > 0 && totalYouReceive > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            You are also owed {formatCents(totalYouReceive, currencySymbol)} from others in this
            group.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
