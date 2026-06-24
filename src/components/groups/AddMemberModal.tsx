"use client";

import { useState } from "react";
import { Link2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteLinkField } from "@/components/invites/InviteLinkField";
import { useAddGroupMember, useFriends, useGroupInvite } from "@/hooks/use-api";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AddMemberModal({ groupId, members }: { groupId: string; members: { id: string }[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: friendsData } = useFriends();
  const { data: inviteData } = useGroupInvite(groupId);
  const addMember = useAddGroupMember(groupId);

  const memberIds = new Set(members.map((m) => m.id));
  const friendsToAdd =
    friendsData?.friends.filter((f) => !memberIds.has(f.friend.id)) ?? [];

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addMember.mutateAsync({ email });
      setEmail("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function handleAddFriend(friendId: string) {
    setError(null);
    try {
      await addMember.mutateAsync({ userId: friendId });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
          Add people
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add people to group</DialogTitle>
          <DialogDescription>
            Share an invite link or add friends who already use FairSplit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {inviteData?.url && <InviteLinkField url={inviteData.url} label="Group invite link" />}

          {friendsToAdd.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Add from friends</p>
              <div className="space-y-2">
                {friendsToAdd.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {getInitials(item.friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.friend.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.friend.email}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="brand"
                      disabled={addMember.isPending}
                      onClick={() => handleAddFriend(item.friend.id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              Add by email
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addMember.isPending || !email}>
                {addMember.isPending ? "Adding..." : "Add to group"}
              </Button>
            </form>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
