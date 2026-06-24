"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { GroupCurrencyProvider } from "@/components/groups/GroupCurrencyContext";
import { useGroup, useMe } from "@/hooks/use-api";

const fabShell =
  "flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-brand-foreground shadow-float ring-4 ring-background";

export function MobileCenterFab() {
  const pathname = usePathname();
  const { data: me } = useMe();

  const match = pathname.match(/^\/groups\/([^/]+)$/);
  const groupId = match?.[1] && match[1] !== "new" ? match[1] : null;

  const { data: groupData } = useGroup(groupId ?? "");

  if (groupId && groupData?.group && me?.user) {
    const members = groupData.group.members.map((m) => m.user);
    return (
      <GroupCurrencyProvider currency={groupData.group.currency}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <AddExpenseModal
            groupId={groupId}
            members={members}
            currentUserId={me.user.id}
            variant="fab"
            fabClassName={fabShell}
          />
        </div>
      </GroupCurrencyProvider>
    );
  }

  return (
    <Link
      href="/groups/new"
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${fabShell}`}
      aria-label="Create new group"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
