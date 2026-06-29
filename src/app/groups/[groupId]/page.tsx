"use client";

import { use, Suspense } from "react";
import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityFeed } from "@/components/groups/ActivityFeed";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { ShareGroupInviteButton } from "@/components/groups/ShareGroupInviteButton";
import { GroupActivityLog } from "@/components/groups/GroupActivityLog";
import { GroupCurrencyProvider, useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { GroupMemberPreview } from "@/components/groups/GroupMemberPreview";
import { GroupQuickActions } from "@/components/groups/GroupQuickActions";
import { GroupTabProvider, useGroupTab } from "@/components/groups/group-tab-context";
import { GroupSettings } from "@/components/groups/GroupSettings";
import { MemberBalances } from "@/components/groups/MemberBalances";
import { SimplifiedDebtsBanner } from "@/components/groups/SimplifiedDebtsBanner";
import { YourSettleUpBanner } from "@/components/groups/YourSettleUpBanner";
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
import type { GroupMember } from "@/lib/api-client";
import { getGroupCoverClass } from "@/lib/group-cover";
import { cn } from "@/lib/utils";

function GroupHero({
  group,
  members,
  groupMembers,
  membersCount,
  onToggleFavorite,
  isFavorite,
}: {
  group: NonNullable<ReturnType<typeof useGroup>["data"]>["group"];
  members: { id: string }[];
  groupMembers: GroupMember[];
  membersCount: number;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}) {
  const { currency, currencySymbol } = useGroupCurrency();
  const cover = getGroupCoverClass(group.id);

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-soft border border-border">
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
            <ShareGroupInviteButton groupId={group.id} variant="icon" />
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
        <GroupMemberPreview members={groupMembers} groupName={group.name} />
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
          <AddMemberModal groupId={group.id} members={members} />
        </div>
      </div>
    </div>
  );
}

function GroupTabs({
  groupId,
  group,
  members,
  me,
  balances,
  balancesLoading,
  settlements,
  settlementsLoading,
  onDeleteExpense,
}: {
  groupId: string;
  group: NonNullable<ReturnType<typeof useGroup>["data"]>["group"] | undefined;
  members: { id: string; name: string; email: string }[];
  me: ReturnType<typeof useMe>["data"];
  balances: ReturnType<typeof useGroupBalances>["data"];
  balancesLoading: boolean;
  settlements: ReturnType<typeof useSettlements>["data"];
  settlementsLoading: boolean;
  onDeleteExpense: (expenseId: string) => void;
}) {
  const { activeTab, setActiveTab, tabsRef } = useGroupTab();

  const settleBadge =
    settlements && settlements.transactionCount > 0 ? settlements.transactionCount : null;

  return (
    <div id="group-tabs" ref={tabsRef} className="scroll-mt-6">
    <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as typeof activeTab)}>
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settle" className="gap-1.5">
          Settle up
          {settleBadge !== null && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground">
              {settleBadge}
            </span>
          )}
        </TabsTrigger>
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
            onDeleteExpense={onDeleteExpense}
          />
        ) : (
          <p className="text-muted-foreground">Loading activity...</p>
        )}
      </TabsContent>

      <TabsContent value="settle">
        {settlementsLoading || balancesLoading ? (
          <p className="text-muted-foreground">Loading settlements...</p>
        ) : settlements && balances && me?.user && group ? (
          <SettleUpTab
            groupId={groupId}
            settlements={settlements}
            balances={balances}
            expenses={group.expenses}
            payments={group.payments ?? []}
            currentUserId={me.user.id}
            defaultSettlementMode={group.settlementMode}
          />
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
  );
}

function GroupPageContent({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { data: me } = useMe();
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: balances, isLoading: balancesLoading } = useGroupBalances(groupId);
  const { data: settlements, isLoading: settlementsLoading } = useSettlements(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const toggleFavorite = useToggleFavorite(groupId);

  const group = groupData?.group;
  const groupMembers = group?.members ?? [];
  const members = groupMembers.map((m) => m.user);

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense.mutateAsync(expenseId);
  }

  return (
    <AppShell>
      <GroupCurrencyProvider currency={group?.currency ?? "USD"}>
        <GroupTabProvider>
        <div className="space-y-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
          <div className="space-y-6">
            {groupLoading || !group ? (
              <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            ) : (
              <GroupHero
                group={group}
                members={members}
                groupMembers={groupMembers}
                membersCount={members.length}
                onToggleFavorite={() => toggleFavorite.mutate()}
                isFavorite={group.isFavorite}
              />
            )}

            {me?.user && (
              <YourSettleUpBanner
                groupId={groupId}
                currentUserId={me.user.id}
                balances={balances}
                settlements={settlements}
                isLoading={balancesLoading || settlementsLoading}
              />
            )}

            {balances && me?.user && (
              <section>
                <h2 className="mb-3 text-lg font-bold">Member Balances</h2>
                <MemberBalances balances={balances} currentUserId={me.user.id} />
              </section>
            )}

            {settlements && !settlementsLoading && (
              <SimplifiedDebtsBanner settlements={settlements} groupId={groupId} />
            )}

            <GroupTabs
              groupId={groupId}
              group={group}
              members={members}
              me={me}
              balances={balances}
              balancesLoading={balancesLoading}
              settlements={settlements}
              settlementsLoading={settlementsLoading}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>

          {/* Desktop sticky sidebar - event checkout style */}
          <aside className="hidden lg:block lg:sticky lg:top-6">
            {me?.user && group && (
              <GroupQuickActions
                groupId={groupId}
                members={members}
                currentUserId={me.user.id}
                balances={balances}
                settlements={settlements}
              />
            )}
          </aside>
        </div>
        </GroupTabProvider>
      </GroupCurrencyProvider>
    </AppShell>
  );
}

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GroupPageContent params={params} />
    </Suspense>
  );
}
