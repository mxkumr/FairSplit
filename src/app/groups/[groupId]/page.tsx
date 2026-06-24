"use client";

import { use } from "react";
import { ArrowLeft, Share2, Star } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { ActivityFeed } from "@/components/groups/ActivityFeed";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { GroupActivityLog } from "@/components/groups/GroupActivityLog";
import { GroupCurrencyProvider, useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { GroupQuickActions } from "@/components/groups/GroupQuickActions";
import { GroupSettings } from "@/components/groups/GroupSettings";
import { MemberBalances } from "@/components/groups/MemberBalances";
import { RawBalancesTab } from "@/components/groups/RawBalancesTab";
import { SettleUpTab } from "@/components/groups/SettleUpTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteExpense,
  useGroup,
  useGroupBalances,
  useMe,
  useSettlements,
  useToggleFavorite,
} from "@/hooks/use-api";
import { getGroupCoverClass } from "@/lib/group-cover";
import { cn } from "@/lib/utils";

function GroupHero({
  group,
  membersCount,
  onToggleFavorite,
  isFavorite,
}: {
  group: NonNullable<ReturnType<typeof useGroup>["data"]>["group"];
  membersCount: number;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}) {
  const { currency, currencySymbol } = useGroupCurrency();
  const cover = getGroupCoverClass(group.id);

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-soft border border-border/50">
      <div className={cn("relative h-44 bg-gradient-to-br sm:h-56", cover)}>
        <div className="absolute inset-0 flex items-start justify-between p-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full glass"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full glass"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full glass"
              onClick={onToggleFavorite}
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isFavorite ? "fill-amber-400 text-amber-400" : "text-foreground",
                )}
              />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Group Details
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{group.name}</h1>
        {group.information && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {group.information}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{membersCount} members</span>
          <span>-</span>
          <span>
            {currency} ({currencySymbol})
          </span>
          <span>-</span>
          <span>{group.expenses.length} expenses</span>
          <AddMemberModal groupId={group.id} />
        </div>
      </div>
    </div>
  );
}

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { data: me } = useMe();
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: balances, isLoading: balancesLoading } = useGroupBalances(groupId);
  const { data: settlements, isLoading: settlementsLoading } = useSettlements(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const toggleFavorite = useToggleFavorite(groupId);

  const group = groupData?.group;
  const members = group?.members.map((m) => m.user) ?? [];

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense.mutateAsync(expenseId);
  }

  return (
    <AppShell>
      <GroupCurrencyProvider currency={group?.currency ?? "USD"}>
        <div className="space-y-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
          <div className="space-y-6">
            {groupLoading || !group ? (
              <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            ) : (
              <GroupHero
                group={group}
                membersCount={members.length}
                onToggleFavorite={() => toggleFavorite.mutate()}
                isFavorite={group.isFavorite}
              />
            )}

            {balances && me?.user && (
              <section>
                <h2 className="mb-3 text-lg font-bold">Member Balances</h2>
                <MemberBalances balances={balances} currentUserId={me.user.id} />
              </section>
            )}

            <Tabs defaultValue="activity">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settle">Settle Up</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="log">Log</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                {group && me?.user ? (
                  <ActivityFeed
                    expenses={group.expenses}
                    payments={group.payments ?? []}
                    groupId={groupId}
                    members={members}
                    currentUserId={me.user.id}
                    onDeleteExpense={handleDeleteExpense}
                  />
                ) : (
                  <p className="text-muted-foreground">Loading activity...</p>
                )}
              </TabsContent>

              <TabsContent value="settle">
                {settlementsLoading ? (
                  <p className="text-muted-foreground">Loading settlements...</p>
                ) : settlements && me?.user ? (
                  <SettleUpTab
                    groupId={groupId}
                    settlements={settlements}
                    currentUserId={me.user.id}
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="balances">
                {balancesLoading ? (
                  <p className="text-muted-foreground">Loading balances...</p>
                ) : balances ? (
                  <RawBalancesTab balances={balances} />
                ) : null}
              </TabsContent>

              <TabsContent value="log">
                <GroupActivityLog groupId={groupId} />
              </TabsContent>

              <TabsContent value="settings">
                {group && <GroupSettings group={group} groupId={groupId} />}
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop sticky sidebar - event checkout style */}
          <aside className="hidden lg:block lg:sticky lg:top-6">
            {me?.user && group && (
              <GroupQuickActions
                groupId={groupId}
                members={members}
                currentUserId={me.user.id}
                balances={balances}
              />
            )}
          </aside>
        </div>

        {me?.user && group && (
          <div className="fixed bottom-24 right-4 z-30 lg:hidden">
            <AddExpenseModal
              groupId={groupId}
              members={members}
              currentUserId={me.user.id}
              variant="fab"
            />
          </div>
        )}
      </GroupCurrencyProvider>
    </AppShell>
  );
}
