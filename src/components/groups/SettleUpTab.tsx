"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle, ChevronDown, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettlementExplanation } from "@/components/groups/SettlementExplanation";
import { useRecordPayment } from "@/hooks/use-api";
import { formatCents, parseDollarsToCents } from "@/lib/money";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { cn } from "@/lib/utils";
import type { AuthUser, BalanceResponse, SettlementResponse } from "@/lib/api-client";

type SettlementItem = SettlementResponse["settlements"][0];
type DebtItem = BalanceResponse["debts"][0];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function groupByPayer<T extends { fromUserId: string; fromUser: AuthUser; amount: number }>(
  items: T[],
) {
  const map = new Map<
    string,
    { fromUserId: string; fromUser: AuthUser; totalAmount: number; items: T[] }
  >();

  for (const item of items) {
    const existing = map.get(item.fromUserId);
    if (existing) {
      existing.totalAmount += item.amount;
      existing.items.push(item);
    } else {
      map.set(item.fromUserId, {
        fromUserId: item.fromUserId,
        fromUser: item.fromUser,
        totalAmount: item.amount,
        items: [item],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount);
}

function PaymentSplitRow({
  toName,
  amount,
  currencySymbol,
  action,
}: {
  toName: string;
  amount: number;
  currencySymbol: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-background/60 px-3 py-2.5 border border-border/50">
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-[10px]">{getInitials(toName)}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium flex-1 min-w-0 truncate">{toName}</span>
      <Badge variant="default">{formatCents(amount, currencySymbol)}</Badge>
      {action}
    </div>
  );
}

function PayerSettlementCard({
  group,
  currencySymbol,
  currentUserId,
  expanded,
  onToggle,
  onRecord,
}: {
  group: ReturnType<typeof groupByPayer<SettlementItem>>[0];
  currencySymbol: string;
  currentUserId: string;
  expanded: boolean;
  onToggle: () => void;
  onRecord: (item: SettlementItem) => void;
}) {
  const payerName = group.fromUser.name;
  const explanation = group.items[0]?.explanation;
  const splits = [...group.items].sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardContent className="py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 text-left"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-xs font-bold">
              {getInitials(payerName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{payerName}</p>
            <p className="text-sm text-muted-foreground">
              needs to pay {formatCents(group.totalAmount, currencySymbol)}
              {splits.length > 1 && (
                <span className="text-muted-foreground/80">
                  {" "}
                  · {splits.length} people
                </span>
              )}
            </p>
          </div>
          <Badge variant="default" className="shrink-0">
            {formatCents(group.totalAmount, currencySymbol)}
          </Badge>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
            {explanation && (
              <SettlementExplanation
                lines={explanation.lines}
                summary={`${payerName} pays ${formatCents(group.totalAmount, currencySymbol)} total across ${splits.length} ${splits.length === 1 ? "person" : "people"} to settle the group.`}
                payerName={payerName}
                defaultOpen={group.fromUserId === currentUserId}
              />
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                Payment split
              </p>
              {splits.map((s) => {
                const canRecord =
                  s.fromUserId === currentUserId || s.toUserId === currentUserId;
                return (
                  <PaymentSplitRow
                    key={`${s.fromUserId}-${s.toUserId}`}
                    toName={s.toUser.name}
                    amount={s.amount}
                    currencySymbol={currencySymbol}
                    action={
                      canRecord ? (
                        <Button size="sm" variant="outline" onClick={() => onRecord(s)}>
                          <CheckCircle className="h-4 w-4" />
                          Record
                        </Button>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PayerDebtCard({
  group,
  currencySymbol,
  expanded,
  onToggle,
}: {
  group: ReturnType<typeof groupByPayer<DebtItem>>[0];
  currencySymbol: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const payerName = group.fromUser.name;
  const splits = [...group.items].sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardContent className="py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 text-left"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-xs font-bold">
              {getInitials(payerName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{payerName}</p>
            <p className="text-sm text-muted-foreground">
              owes {formatCents(group.totalAmount, currencySymbol)}
              {splits.length > 1 && (
                <span className="text-muted-foreground/80">
                  {" "}
                  · {splits.length} people
                </span>
              )}
            </p>
          </div>
          <Badge variant="default" className="shrink-0">
            {formatCents(group.totalAmount, currencySymbol)}
          </Badge>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded && (
          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Owes to
            </p>
            {splits.map((debt) => (
              <PaymentSplitRow
                key={`${debt.fromUserId}-${debt.toUserId}`}
                toName={debt.toUser.name}
                amount={debt.amount}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SettleUpTab({
  groupId,
  settlements,
  balances,
  currentUserId,
}: {
  groupId: string;
  settlements: SettlementResponse;
  balances: BalanceResponse;
  currentUserId: string;
}) {
  const { currencySymbol } = useGroupCurrency();
  const recordPayment = useRecordPayment(groupId);
  const [simplifyDebts, setSimplifyDebts] = useState(true);
  const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
  const [recording, setRecording] = useState<{
    fromUserId: string;
    toUserId: string;
    maxAmount: number;
    fromName: string;
    toName: string;
  } | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { rawDebtCount, transactionCount, paymentsSaved } = settlements;
  const showSimplified = simplifyDebts && settlements.settlements.length > 0;
  const isEmpty = showSimplified
    ? settlements.settlements.length === 0
    : balances.debts.length === 0;

  const groupedSettlements = useMemo(
    () => groupByPayer(settlements.settlements),
    [settlements.settlements],
  );

  const groupedDebts = useMemo(() => groupByPayer(balances.debts), [balances.debts]);

  const defaultExpandedPayer = useMemo(() => {
    const payerGroups = showSimplified ? groupedSettlements : groupedDebts;
    const mine = payerGroups.find((g) => g.fromUserId === currentUserId);
    return mine?.fromUserId ?? payerGroups[0]?.fromUserId ?? null;
  }, [showSimplified, groupedSettlements, groupedDebts, currentUserId]);

  const [hasToggledExpand, setHasToggledExpand] = useState(false);
  const activeExpandedId = hasToggledExpand ? expandedPayerId : defaultExpandedPayer;

  function togglePayer(payerId: string) {
    setHasToggledExpand(true);
    setExpandedPayerId((current) => (current === payerId ? null : payerId));
  }

  function openRecord(s: SettlementItem) {
    setRecording({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      maxAmount: s.amount,
      fromName: s.fromUser.name,
      toName: s.toUser.name,
    });
    setAmountInput((s.amount / 100).toFixed(2));
    setNote("");
    setError(null);
  }

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!recording) return;
    setError(null);

    const amount = parseDollarsToCents(amountInput);
    if (amount === null || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > recording.maxAmount) {
      setError(`Maximum payment is ${formatCents(recording.maxAmount, currencySymbol)}`);
      return;
    }

    try {
      await recordPayment.mutateAsync({
        fromUserId: recording.fromUserId,
        toUserId: recording.toUserId,
        amount,
        note: note.trim() || undefined,
      });
      setRecording(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="border-border/80">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <p className="font-semibold">Simplify debts</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Combine everyone&apos;s balances into the fewest payments. Great for large groups
                  - e.g. 10 people with many expenses may only need a handful of transfers.
                </p>
              </div>
              <div className="flex rounded-full border border-border p-1 bg-muted/40 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSimplifyDebts(true);
                    setHasToggledExpand(false);
                    setExpandedPayerId(null);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    simplifyDebts
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Simplified
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimplifyDebts(false);
                    setHasToggledExpand(false);
                    setExpandedPayerId(null);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    !simplifyDebts
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All debts
                </button>
              </div>
            </div>

            {simplifyDebts && rawDebtCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="rounded-2xl bg-muted/60 px-3 py-2">
                  <span className="text-muted-foreground">Without simplification: </span>
                  <span className="font-semibold">{rawDebtCount} payments</span>
                </div>
                <div className="rounded-2xl bg-brand/10 px-3 py-2">
                  <span className="text-muted-foreground">Simplified: </span>
                  <span className="font-semibold text-brand">{transactionCount} payments</span>
                </div>
                {paymentsSaved > 0 && (
                  <div className="rounded-2xl bg-success-muted px-3 py-2 text-success-foreground">
                    <span className="font-semibold">
                      Save {paymentsSaved} transaction{paymentsSaved === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isEmpty ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              All settled up! No payments needed.
            </CardContent>
          </Card>
        ) : showSimplified ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tap a person to see who they pay and record payments.
            </p>
            {groupedSettlements.map((group) => (
              <PayerSettlementCard
                key={group.fromUserId}
                group={group}
                currencySymbol={currencySymbol}
                currentUserId={currentUserId}
                expanded={activeExpandedId === group.fromUserId}
                onToggle={() => togglePayer(group.fromUserId)}
                onRecord={openRecord}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Every individual debt between members, grouped by who owes. Tap to see the split.
            </p>
            {groupedDebts.map((group) => (
              <PayerDebtCard
                key={group.fromUserId}
                group={group}
                currencySymbol={currencySymbol}
                expanded={activeExpandedId === group.fromUserId}
                onToggle={() => togglePayer(group.fromUserId)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!recording} onOpenChange={(open) => !open && setRecording(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {recording && (
                <>
                  {recording.fromName} paid {recording.toName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecord} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount ({currencySymbol})</Label>
              <Input
                id="payment-amount"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              {recording && (
                <p className="text-xs text-muted-foreground">
                  Max: {formatCents(recording.maxAmount, currencySymbol)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">Note (optional)</Label>
              <Input
                id="payment-note"
                placeholder="e.g. Venmo, cash"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Recording..." : "Record payment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
