"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { DashboardBalances, GroupSummary } from "@/lib/api-client";

export function GroupList({
  groups,
  balances,
}: {
  groups: GroupSummary[];
  balances?: DashboardBalances;
}) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No groups yet.</p>
          <Link href="/groups/new" className="mt-2 inline-block text-primary hover:underline">
            Create your first group
          </Link>
        </CardContent>
      </Card>
    );
  }

  const balanceMap = new Map(balances?.groups.map((g) => [g.groupId, g.netAmount]) ?? []);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Your Groups</h2>
      {groups.map((group) => {
        const net = balanceMap.get(group.id) ?? 0;
        return (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.memberCount} members · {group._count.expenses} expenses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {net !== 0 && (
                    <Badge variant={net > 0 ? "success" : "warning"}>
                      {net > 0 ? `+${formatCents(net)}` : formatCents(net)}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
