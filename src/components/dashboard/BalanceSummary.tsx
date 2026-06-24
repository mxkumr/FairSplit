"use client";

import { formatCents } from "@/lib/money";
import type { DashboardBalances } from "@/lib/api-client";

export function BalanceSummary({ balances }: { balances: DashboardBalances }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl bg-card p-5 shadow-soft border border-border">
        <p className="text-sm font-medium text-muted-foreground">You are owed</p>
        <p className="mt-1 text-3xl font-bold text-success">
          {formatCents(balances.totalOwed)}
        </p>
      </div>
      <div className="rounded-3xl bg-card p-5 shadow-soft border border-border">
        <p className="text-sm font-medium text-muted-foreground">You owe</p>
        <p className="mt-1 text-3xl font-bold text-brand">
          {formatCents(balances.totalOwing)}
        </p>
      </div>
    </div>
  );
}
