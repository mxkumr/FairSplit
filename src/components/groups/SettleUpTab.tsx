"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
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
import { useRecordPayment } from "@/hooks/use-api";
import { formatCents, parseDollarsToCents } from "@/lib/money";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import type { SettlementResponse } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SettleUpTab({
  groupId,
  settlements,
  currentUserId,
}: {
  groupId: string;
  settlements: SettlementResponse;
  currentUserId: string;
}) {
  const { currencySymbol } = useGroupCurrency();
  const recordPayment = useRecordPayment(groupId);
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
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Suggested payments to settle the group.
          </p>
          <Badge variant="secondary">{settlements.transactionCount} payments</Badge>
        </div>
        {settlements.settlements.map((s) => {
          const canRecord =
            s.fromUserId === currentUserId || s.toUserId === currentUserId;
          return (
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
                <Badge variant="default">{formatCents(s.amount, currencySymbol)}</Badge>
                {canRecord && (
                  <Button size="sm" variant="outline" onClick={() => openRecord(s)}>
                    <CheckCircle className="h-4 w-4" />
                    Record
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
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
