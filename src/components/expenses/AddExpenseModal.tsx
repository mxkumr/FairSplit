"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExpense } from "@/hooks/use-api";
import { formatCents, parseDollarsToCents, splitEqually } from "@/lib/money";
import type { AuthUser } from "@/lib/api-client";

type SplitMode = "equal" | "unequal";

type SplitEntry = {
  userId: string;
  amountOwed: number;
  enabled: boolean;
};

export function AddExpenseModal({
  groupId,
  members,
  currentUserId,
}: {
  groupId: string;
  members: AuthUser[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCreateExpense(groupId);

  useEffect(() => {
    if (open) {
      setSplits(
        members.map((m) => ({
          userId: m.id,
          amountOwed: 0,
          enabled: true,
        })),
      );
      setPaidByUserId(currentUserId);
      setDescription("");
      setAmountInput("");
      setSplitMode("equal");
      setError(null);
    }
  }, [open, members, currentUserId]);

  const amountCents = parseDollarsToCents(amountInput);
  const enabledSplits = splits.filter((s) => s.enabled);
  const splitTotal = enabledSplits.reduce((sum, s) => sum + s.amountOwed, 0);
  const enabledUserIds = enabledSplits
    .map((s) => s.userId)
    .sort()
    .join(",");

  useEffect(() => {
    if (splitMode !== "equal" || amountCents === null) return;

    const userIds = enabledUserIds.split(",").filter(Boolean);
    if (userIds.length === 0) return;

    const equalSplits = splitEqually(amountCents, userIds);

    setSplits((prev) =>
      prev.map((s) => {
        const match = equalSplits.find((e) => e.userId === s.userId);
        if (!s.enabled) return { ...s, amountOwed: 0 };
        return { ...s, amountOwed: match?.amountOwed ?? 0 };
      }),
    );
  }, [splitMode, amountCents, enabledUserIds]);

  function toggleMember(userId: string) {
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  function updateSplitAmount(userId: string, dollars: string) {
    const cents = parseDollarsToCents(dollars) ?? 0;
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, amountOwed: cents } : s)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (amountCents === null || amountCents <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (enabledSplits.length === 0) {
      setError("Select at least one person to split with");
      return;
    }
    if (splitTotal !== amountCents) {
      setError(`Splits must sum to ${formatCents(amountCents)} (currently ${formatCents(splitTotal)})`);
      return;
    }

    try {
      await createExpense.mutateAsync({
        description: description.trim(),
        amount: amountCents,
        paidByUserId,
        splits: enabledSplits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
        })),
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">Add Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a new expense and split it among members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Dinner, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidByUserId} onValueChange={setPaidByUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={splitMode === "equal" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSplitMode("equal")}
              >
                Equal
              </Button>
              <Button
                type="button"
                variant={splitMode === "unequal" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSplitMode("unequal")}
              >
                Unequal
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split among</Label>
            <div className="space-y-2 rounded-md border p-3">
              {splits.map((split) => {
                const member = members.find((m) => m.id === split.userId);
                if (!member) return null;
                return (
                  <div key={split.userId} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={split.enabled}
                      onChange={() => toggleMember(split.userId)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-sm">{member.name}</span>
                    {splitMode === "unequal" && split.enabled && (
                      <Input
                        className="w-24 h-9"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={
                          split.amountOwed > 0
                            ? (split.amountOwed / 100).toFixed(2)
                            : ""
                        }
                        onChange={(e) => updateSplitAmount(split.userId, e.target.value)}
                      />
                    )}
                    {splitMode === "equal" && split.enabled && (
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        {amountCents !== null ? formatCents(split.amountOwed) : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {amountCents !== null && (
              <p className="text-xs text-muted-foreground">
                Total: {formatCents(splitTotal)} / {formatCents(amountCents)}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={createExpense.isPending}>
            {createExpense.isPending ? "Saving..." : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
