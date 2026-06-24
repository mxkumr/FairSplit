"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { BalanceSummary } from "@/components/dashboard/BalanceSummary";
import { FeaturedGroupCard, OngoingSplitCard } from "@/components/dashboard/GroupCards";
import { FriendBalances } from "@/components/dashboard/FriendBalances";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBalances, useGroups } from "@/hooks/use-api";

export default function DashboardPage() {
  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const [search, setSearch] = useState("");

  const isLoading = groupsLoading || balancesLoading;

  const balanceMap = useMemo(
    () => new Map(balances?.groups.map((g) => [g.groupId, g.netAmount]) ?? []),
    [balances],
  );

  const groups = groupsData?.groups ?? [];

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.information?.toLowerCase().includes(q) ?? false),
    );
  }, [groups, search]);

  const featuredGroup =
    filteredGroups.find((g) => g.isFavorite) ??
    [...filteredGroups].sort((a, b) => b._count.expenses - a._count.expenses)[0];

  const ongoingGroups = filteredGroups
    .filter((g) => g.id !== featuredGroup?.id)
    .filter((g) => (balanceMap.get(g.id) ?? 0) !== 0 || g._count.expenses > 0);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">Your expense groups in</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            FairSplit <span className="text-muted-foreground font-semibold">Dashboard</span>
          </h1>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
          <Button variant="default" size="icon" className="shrink-0 rounded-2xl" aria-label="Filter">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            <div className="h-24 animate-pulse rounded-3xl bg-muted" />
          </div>
        ) : (
          <>
            {balances && <BalanceSummary balances={balances} />}

            {featuredGroup && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Featured Group</h2>
                  <Link
                    href="/groups/new"
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    See all
                  </Link>
                </div>
                <FeaturedGroupCard
                  group={featuredGroup}
                  netAmount={balanceMap.get(featuredGroup.id) ?? 0}
                />
              </section>
            )}

            {ongoingGroups.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Ongoing Splits</h2>
                  <span className="text-sm text-muted-foreground">
                    {ongoingGroups.length} active
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {ongoingGroups.map((group) => (
                    <OngoingSplitCard
                      key={group.id}
                      group={group}
                      netAmount={balanceMap.get(group.id) ?? 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredGroups.length === 0 && (
              <div className="rounded-3xl bg-card py-12 text-center shadow-soft border border-border text-muted-foreground">
                <p className="text-muted-foreground">
                  {search ? "No groups match your search." : "No groups yet."}
                </p>
                {!search && (
                  <Button asChild variant="brand" className="mt-4">
                    <Link href="/groups/new">Create your first group</Link>
                  </Button>
                )}
              </div>
            )}

            {balances && <FriendBalances balances={balances} />}
          </>
        )}
      </div>
    </AppShell>
  );
}
