"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BalanceSummary } from "@/components/dashboard/BalanceSummary";
import { GroupList } from "@/components/dashboard/GroupList";
import { Button } from "@/components/ui/button";
import { useBalances, useGroups } from "@/hooks/use-api";

export default function DashboardPage() {
  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const { data: balances, isLoading: balancesLoading } = useBalances();

  const isLoading = groupsLoading || balancesLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/groups/new">New Group</Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {balances && <BalanceSummary balances={balances} />}
            {groupsData && (
              <GroupList groups={groupsData.groups} balances={balances} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
