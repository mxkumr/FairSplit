"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethodFields } from "@/components/payments/PaymentMethodFields";
import { useUpdatePayment } from "@/hooks/use-api";
import { formatCents, parseDollarsToCents } from "@/lib/money";
import {
  buildPaymentNote,
  DEFAULT_PAYMENT_METHOD,
  parsePaymentNote,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { getMaxPaymentAmountAfterRemoving } from "@/lib/payment-validation";
import type { ExpenseItem, PaymentItem } from "@/lib/api-client";

function toBalanceInputs(expenses: ExpenseItem[], payments: PaymentItem[]) {
  return {
    expenses: expenses.map((expense) => ({
      paidByUserId: expense.paidBy.id,
      amount: expense.amount,
      paidBy: expense.paidBy,
      splits: expense.splits,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      fromUserId: payment.fromUser.id,
      toUserId: payment.toUser.id,
      amount: payment.amount,
      fromUser: payment.fromUser,
      toUser: payment.toUser,
    })),
  };
}

export function EditPaymentDialog({
  groupId,
  payment,
  expenses,
  payments,
  currencySymbol,
  open,
  onOpenChange,
}: {
  groupId: string;
  payment: PaymentItem | null;
  expenses: ExpenseItem[];
  payments: PaymentItem[];
  currencySymbol: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updatePayment = useUpdatePayment(groupId);
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxAmount = useMemo(() => {
    if (!payment) return 0;
    const inputs = toBalanceInputs(expenses, payments);
    return getMaxPaymentAmountAfterRemoving(
      inputs.expenses,
      inputs.payments,
      payment.id,
      payment.fromUser.id,
      payment.toUser.id,
    );
  }, [expenses, payment, payments]);

  useEffect(() => {
    if (!payment || !open) return;
    const parsed = parsePaymentNote(payment.note);
    setAmountInput((payment.amount / 100).toFixed(2));
    setPaymentMethod(parsed.method);
    setNote(parsed.extraNote);
    setError(null);
  }, [payment, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payment) return;
    setError(null);

    const amount = parseDollarsToCents(amountInput);
    if (amount === null || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > maxAmount) {
      setError(`Maximum payment is ${formatCents(maxAmount, currencySymbol)}`);
      return;
    }

    const nextNote = buildPaymentNote(paymentMethod, note);
    const noteChanged = nextNote !== (payment.note ?? "");
    const amountChanged = amount !== payment.amount;

    if (!amountChanged && !noteChanged) {
      onOpenChange(false);
      return;
    }

    try {
      await updatePayment.mutateAsync({
        paymentId: payment.id,
        body: {
          ...(amountChanged ? { amount } : {}),
          ...(noteChanged ? { note: nextNote } : {}),
        },
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit payment</DialogTitle>
          <DialogDescription>
            {payment && (
              <>
                {payment.fromUser.name} paid {payment.toUser.name}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {payment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-amount">Amount ({currencySymbol})</Label>
              <Input
                id="edit-payment-amount"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Max: {formatCents(maxAmount, currencySymbol)}
              </p>
            </div>
            <PaymentMethodFields
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              note={note}
              onNoteChange={setNote}
              methodId="edit-payment-method"
              noteId="edit-payment-note"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={updatePayment.isPending}>
              {updatePayment.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
