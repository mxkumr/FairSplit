"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type ExpensePayload } from "@/lib/api-client";
import {
  formatCents,
  parseDollarsToCents,
  splitByPercentages,
  splitByShares,
  splitEqually,
} from "@/lib/money";
import type { AuthUser } from "@/lib/api-client";

type UiSplitMode = "equal" | "shares" | "percentage" | "unequal";

type SplitEntry = {
  userId: string;
  amountOwed: number;
  percentage: number;
  shares: number;
  enabled: boolean;
};

const MODE_MAP: Record<UiSplitMode, string> = {
  equal: "EVENLY",
  shares: "BY_SHARES",
  percentage: "BY_PERCENTAGE",
  unequal: "BY_AMOUNT",
};

export function ExpenseForm({
  members,
  currentUserId,
  currencySymbol = "$",
  initial,
  onSubmit,
  isPending,
  submitLabel,
  onFileSelect,
}: {
  members: AuthUser[];
  currentUserId: string;
  currencySymbol?: string;
  initial?: {
    description: string;
    amount: number;
    paidByUserId: string;
    expenseDate: string;
    categoryId?: number | null;
    notes?: string | null;
    recurrenceRule?: string;
    splitMode?: string;
    splits: { userId: string; amountOwed: number; shares?: number }[];
  };
  onSubmit: (values: ExpensePayload) => Promise<void>;
  isPending: boolean;
  submitLabel: string;
  onFileSelect?: (file: File | null) => void;
}) {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountInput, setAmountInput] = useState(
    initial ? (initial.amount / 100).toFixed(2) : "",
  );
  const [paidByUserId, setPaidByUserId] = useState(initial?.paidByUserId ?? currentUserId);
  const [expenseDate, setExpenseDate] = useState(
    initial?.expenseDate
      ? initial.expenseDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId?.toString() ?? "none",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [recurrenceRule, setRecurrenceRule] = useState(initial?.recurrenceRule ?? "NONE");
  const [splitMode, setSplitMode] = useState<UiSplitMode>("equal");
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSplits(
      members.map((m) => {
        const existing = initial?.splits.find((s) => s.userId === m.id);
        return {
          userId: m.id,
          amountOwed: existing?.amountOwed ?? 0,
          percentage:
            existing && initial
              ? Math.round((existing.amountOwed / initial.amount) * 100)
              : Math.floor(100 / members.length),
          shares: existing?.shares ?? 1,
          enabled: initial ? !!existing : true,
        };
      }),
    );
  }, [members, initial]);

  const amountCents = parseDollarsToCents(amountInput);
  const enabledSplits = splits.filter((s) => s.enabled);
  const splitTotal = enabledSplits.reduce((sum, s) => sum + s.amountOwed, 0);
  const enabledUserIds = enabledSplits
    .map((s) => s.userId)
    .sort()
    .join(",");
  const percentageTotal = enabledSplits.reduce((sum, s) => sum + s.percentage, 0);

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

  useEffect(() => {
    if (splitMode !== "shares" || amountCents === null) return;
    const entries = enabledSplits.map((s) => ({ userId: s.userId, shares: s.shares }));
    if (entries.length === 0) return;
    const shareSplits = splitByShares(amountCents, entries);
    setSplits((prev) =>
      prev.map((s) => {
        const match = shareSplits.find((e) => e.userId === s.userId);
        if (!s.enabled) return { ...s, amountOwed: 0 };
        return { ...s, amountOwed: match?.amountOwed ?? 0 };
      }),
    );
  }, [splitMode, amountCents, enabledUserIds, enabledSplits.map((s) => s.shares).join(",")]);

  useEffect(() => {
    if (splitMode !== "percentage" || amountCents === null || percentageTotal !== 100) return;
    const pctSplits = splitByPercentages(
      amountCents,
      enabledSplits.map((s) => ({ userId: s.userId, percentage: s.percentage })),
    );
    setSplits((prev) =>
      prev.map((s) => {
        const match = pctSplits.find((e) => e.userId === s.userId);
        if (!s.enabled) return { ...s, amountOwed: 0 };
        return { ...s, amountOwed: match?.amountOwed ?? 0 };
      }),
    );
  }, [splitMode, amountCents, percentageTotal, enabledUserIds]);

  function selectAll(enabled: boolean) {
    setSplits((prev) => prev.map((s) => ({ ...s, enabled })));
  }

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

  function updatePercentage(userId: string, pct: string) {
    const percentage = parseInt(pct, 10) || 0;
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, percentage } : s)),
    );
  }

  function updateShares(userId: string, val: string) {
    const shares = parseInt(val, 10) || 1;
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, shares: Math.max(1, shares) } : s)),
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
    if (splitMode === "percentage" && percentageTotal !== 100) {
      setError("Percentages must sum to 100%");
      return;
    }
    if (splitTotal !== amountCents) {
      setError(
        `Splits must sum to ${formatCents(amountCents, currencySymbol)} (currently ${formatCents(splitTotal, currencySymbol)})`,
      );
      return;
    }

    try {
      await onSubmit({
        description: description.trim(),
        amount: amountCents,
        paidByUserId,
        expenseDate: new Date(expenseDate).toISOString(),
        categoryId: categoryId === "none" ? null : parseInt(categoryId, 10),
        splitMode: MODE_MAP[splitMode],
        notes: notes.trim() || undefined,
        recurrenceRule,
        splits: enabledSplits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shares: s.shares,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    }
  }

  const categories = categoriesData?.categories ?? [];

  return (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({currencySymbol})</Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Add a note..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Repeat</Label>
        <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Does not repeat</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Split mode</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["equal", "shares", "percentage", "unequal"] as UiSplitMode[]).map((mode) => (
            <Button
              key={mode}
              type="button"
              variant={splitMode === mode ? "default" : "outline"}
              className="capitalize"
              onClick={() => setSplitMode(mode)}
            >
              {mode === "percentage" ? "%" : mode}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Split among</Label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => selectAll(true)}>
              All
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => selectAll(false)}>
              None
            </Button>
          </div>
        </div>
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
                      split.amountOwed > 0 ? (split.amountOwed / 100).toFixed(2) : ""
                    }
                    onChange={(e) => updateSplitAmount(split.userId, e.target.value)}
                  />
                )}
                {splitMode === "shares" && split.enabled && (
                  <Input
                    className="w-16 h-9"
                    inputMode="numeric"
                    value={split.shares}
                    onChange={(e) => updateShares(split.userId, e.target.value)}
                  />
                )}
                {splitMode === "percentage" && split.enabled && (
                  <Input
                    className="w-16 h-9"
                    inputMode="numeric"
                    placeholder="%"
                    value={split.percentage || ""}
                    onChange={(e) => updatePercentage(split.userId, e.target.value)}
                  />
                )}
                {(splitMode === "equal" || splitMode === "shares") && split.enabled && (
                  <span className="text-sm text-muted-foreground w-24 text-right">
                    {amountCents !== null ? formatCents(split.amountOwed, currencySymbol) : "-"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {amountCents !== null && splitMode !== "percentage" && (
          <p className="text-xs text-muted-foreground">
            Total: {formatCents(splitTotal, currencySymbol)} /{" "}
            {formatCents(amountCents, currencySymbol)}
          </p>
        )}
        {splitMode === "percentage" && (
          <p className="text-xs text-muted-foreground">Percentages: {percentageTotal}% / 100%</p>
        )}
      </div>

      {onFileSelect && (
        <div className="space-y-2">
          <Label htmlFor="receipt">Attach receipt (optional)</Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
