"use client";

import Link from "next/link";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { formatCents } from "@/lib/money";
import type { AuthUser, BalanceResponse, SettlementResponse } from "@/lib/api-client";

export function GroupQuickActions({
  groupId,
  members,
  currentUserId,
  balances,
  settlements,
}: {
  groupId: string;
  members: AuthUser[];
  currentUserId: string;
  balances?: BalanceResponse;
  settlements?: SettlementResponse;
}) {
  const { currencySymbol } = useGroupCurrency();
  const net = balances?.netBalances.find((b) => b.userId === currentUserId)?.amount ?? 0;

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft border border-border">
      <h2 className="text-lg font-bold">Quick actions</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add expenses and manage this group.</p>
      <div className="mt-5">
        <AddExpenseModal
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          variant="brand"
        />
      </div>
      {balances && (
        <div className="mt-6 border-t border-border/60 pt-6">
          <p className="text-sm text-muted-foreground">Your balance</p>
          <p className="mt-1 text-2xl font-bold">
            {net === 0 ? (
              <span className="text-success">All settled</span>
            ) : (
              <span className={net > 0 ? "text-success" : "text-brand"}>
                {net > 0 ? "+" : ""}
                {formatCents(net, currencySymbol)}
              </span>
            )}
          </p>
        </div>
      )}
      {settlements && settlements.transactionCount > 0 && (
        <div className="mt-4 rounded-2xl bg-brand/10 p-3 text-sm">
          <p className="font-semibold text-brand">
            {settlements.transactionCount} simplified payment
            {settlements.transactionCount === 1 ? "" : "s"} to settle up
          </p>
          {settlements.paymentsSaved > 0 && (
            <p className="mt-1 text-muted-foreground">
              Saves {settlements.paymentsSaved} vs paying individually
            </p>
          )}
          <Link
            href={`/groups/${groupId}?tab=settle`}
            className="mt-2 inline-block font-semibold text-foreground hover:underline"
          >
            View settle up →
          </Link>
        </div>
      )}
    </div>
  );
}
