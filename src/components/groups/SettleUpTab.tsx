"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
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
import type { BalanceResponse, SettlementResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DebtRow({
  fromName,
  toName,
  amount,
  currencySymbol,
  action,
  explanation,
  payerName,
  explanationOpen,
}: {
  fromName: string;
  toName: string;
  amount: number;
  currencySymbol: string;
  action?: React.ReactNode;
  explanation?: SettlementResponse["settlements"][0]["explanation"];
  payerName?: string;
  explanationOpen?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(fromName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{fromName}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(toName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium flex-1 min-w-16">{toName}</span>
          <Badge variant="default">{formatCents(amount, currencySymbol)}</Badge>
          {action}
        </div>
        {explanation && payerName && (
          <SettlementExplanation
            lines={explanation.lines}
            summary={explanation.summary}
            payerName={payerName}
            defaultOpen={explanationOpen}
          />
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
  const displayDebts = showSimplified ? null : balances.debts;
  const isEmpty = showSimplified
    ? settlements.settlements.length === 0
    : balances.debts.length === 0;

  function openRecord(s: SettlementResponse["settlements"][0]) {
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
                  — e.g. 10 people with many expenses may only need a handful of transfers.
                </p>
              </div>
              <div className="flex rounded-full border border-border p-1 bg-muted/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setSimplifyDebts(true)}
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
                  onClick={() => setSimplifyDebts(false)}
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
                    <span className="font-semibold">Save {paymentsSaved} transaction{paymentsSaved === 1 ? "" : "s"}</span>
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
              Recommended payments to settle the group with the minimum number of transfers.
            </p>
            {settlements.settlements.map((s) => {
              const canRecord =
                s.fromUserId === currentUserId || s.toUserId === currentUserId;
              return (
                <DebtRow
                  key={`${s.fromUserId}-${s.toUserId}`}
                  fromName={s.fromUser.name}
                  toName={s.toUser.name}
                  amount={s.amount}
                  currencySymbol={currencySymbol}
                  payerName={s.fromUser.name}
                  explanation={s.explanation}
                  explanationOpen={s.fromUserId === currentUserId}
                  action={
                    canRecord ? (
                      <Button size="sm" variant="outline" onClick={() => openRecord(s)}>
                        <CheckCircle className="h-4 w-4" />
                        Record
                      </Button>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Every individual debt between members ({balances.debts.length} payment
              {balances.debts.length === 1 ? "" : "s"}). Toggle &quot;Simplified&quot; above to
              reduce this.
            </p>
            {displayDebts?.map((debt) => (
              <DebtRow
                key={`${debt.fromUserId}-${debt.toUserId}`}
                fromName={debt.fromUser.name}
                toName={debt.toUser.name}
                amount={debt.amount}
                currencySymbol={currencySymbol}
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
