"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { ExpenseTimeline } from "@/components/groups/ExpenseTimeline";
import { RawBalancesTab } from "@/components/groups/RawBalancesTab";
import { SettleUpTab } from "@/components/groups/SettleUpTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGroup,
  useGroupBalances,
  useMe,
  useSettlements,
} from "@/hooks/use-api";

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { data: me } = useMe();
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: balances, isLoading: balancesLoading } = useGroupBalances(groupId);
  const { data: settlements, isLoading: settlementsLoading } = useSettlements(groupId);

  const group = groupData?.group;
  const members = group?.members.map((m) => m.user) ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            {groupLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{group?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {members.length} members
                </p>
              </>
            )}
          </div>
        </div>

        {me?.user && group && (
          <AddExpenseModal
            groupId={groupId}
            members={members}
            currentUserId={me.user.id}
          />
        )}

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settle">Settle Up</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {group ? (
              <ExpenseTimeline expenses={group.expenses} />
            ) : (
              <p className="text-muted-foreground">Loading expenses...</p>
            )}
          </TabsContent>

          <TabsContent value="settle">
            {settlementsLoading ? (
              <p className="text-muted-foreground">Loading settlements...</p>
            ) : settlements ? (
              <SettleUpTab settlements={settlements} />
            ) : null}
          </TabsContent>

          <TabsContent value="balances">
            {balancesLoading ? (
              <p className="text-muted-foreground">Loading balances...</p>
            ) : balances ? (
              <RawBalancesTab balances={balances} />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
