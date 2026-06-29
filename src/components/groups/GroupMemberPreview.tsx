"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GroupMember } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function sortMembersByJoinedAt(members: GroupMember[]) {
  return [...members].sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
  );
}

export function GroupMembersListDialog({
  members,
  open,
  onOpenChange,
  groupName,
}: {
  members: GroupMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
}) {
  const sorted = useMemo(() => sortMembersByJoinedAt(members), [members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[min(80vh,520px)] flex flex-col">
        <DialogHeader>
          <DialogTitle>Group participants</DialogTitle>
          <DialogDescription>
            {sorted.length} member{sorted.length === 1 ? "" : "s"} in {groupName}. Most recent
            joins appear first.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-2 -mx-1 overflow-y-auto space-y-1 pr-1">
          {sorted.map((member) => (
            <li
              key={member.user.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-muted/60"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {getInitials(member.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">{member.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
              </div>
              <time
                dateTime={member.joinedAt}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {new Date(member.joinedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function GroupMemberPreview({
  members,
  groupName,
  className,
}: {
  members: GroupMember[];
  groupName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => sortMembersByJoinedAt(members), [members]);

  if (sorted.length === 0) {
    return null;
  }

  const latest = sorted[0];
  const othersCount = sorted.length - 1;

  return (
    <>
      <div className={cn("mt-2 flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
            {getInitials(latest.user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">{getFirstName(latest.user.name)}</span>
        {othersCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-8 items-center rounded-full bg-muted px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={`Show all ${sorted.length} group members`}
          >
            +{othersCount}
          </button>
        )}
      </div>

      <GroupMembersListDialog
        members={members}
        open={open}
        onOpenChange={setOpen}
        groupName={groupName}
      />
    </>
  );
}
