"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteLinkField } from "@/components/invites/InviteLinkField";
import { useGroupInvite } from "@/hooks/use-api";

export function ShareGroupInviteButton({
  groupId,
  variant = "icon",
}: {
  groupId: string;
  variant?: "icon" | "button";
}) {
  const { data, isLoading } = useGroupInvite(groupId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="secondary" size="icon" className="rounded-full glass" aria-label="Share invite link">
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
            Share invite link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to this group</DialogTitle>
          <DialogDescription>
            Share this link so friends can join the group. They will need a FairSplit account.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        ) : data?.url ? (
          <InviteLinkField url={data.url} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
