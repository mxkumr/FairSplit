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
  const {
    data: groupsData,
    isLoading: groupsLoading,
    isError: groupsError,
    error: groupsErr,
  } = useGroups();
  const {
    data: balances,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useBalances();
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
    filteredGroups.length > 1
      ? (filteredGroups.find((g) => g.isFavorite) ??
        [...filteredGroups].sort((a, b) => b._count.expenses - a._count.expenses)[0])
      : undefined;

  const listGroups = featuredGroup
    ? filteredGroups.filter((g) => g.id !== featuredGroup.id)
    : filteredGroups;

  const hasZeroBalances =
    balances &&
    balances.totalOwed === 0 &&
    balances.totalOwing === 0 &&
    groups.length > 0;

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
        ) : groupsError ? (
          <div className="rounded-3xl bg-card py-12 text-center shadow-soft border border-border">
            <p className="font-semibold">Could not load your groups</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {groupsErr instanceof Error ? groupsErr.message : "Try logging out and back in."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        ) : (
          <>
            {balances && !balancesError && <BalanceSummary balances={balances} />}

            {hasZeroBalances && (
              <p className="text-sm text-muted-foreground rounded-2xl bg-muted/50 px-4 py-3">
                Balances are $0 because you are the only member, or everyone is settled up.
                Add friends to a group to split expenses together.
              </p>
            )}

            {featuredGroup && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Featured Group</h2>
                  <Link
                    href="/groups/new"
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    New group
                  </Link>
                </div>
                <FeaturedGroupCard
                  group={featuredGroup}
                  netAmount={balanceMap.get(featuredGroup.id) ?? 0}
                />
              </section>
            )}

            {listGroups.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    Your Groups
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({listGroups.length})
                    </span>
                  </h2>
                  <Link
                    href="/groups/new"
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    New group
                  </Link>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {listGroups.map((group) => (
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
