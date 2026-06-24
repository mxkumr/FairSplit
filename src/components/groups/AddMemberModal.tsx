"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { useAddGroupMember } from "@/hooks/use-api";

export function AddMemberModal({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addMember = useAddGroupMember(groupId);

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add group member</DialogTitle>
          <DialogDescription>
            Enter the email of an existing FairSplit user to add them to this group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={addMember.isPending}>
            {addMember.isPending ? "Adding..." : "Add to group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
