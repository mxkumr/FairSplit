"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useActivities } from "@/hooks/use-api";

const LABELS: Record<string, string> = {
  CREATE_GROUP: "created the group",
  UPDATE_GROUP: "updated group settings",
  CREATE_EXPENSE: "added an expense",
  UPDATE_EXPENSE: "updated an expense",
  DELETE_EXPENSE: "deleted an expense",
  CREATE_PAYMENT: "recorded a payment",
  UPDATE_PAYMENT: "updated a payment",
  DELETE_PAYMENT: "deleted a payment",
  ADD_MEMBER: "added a member",
  REMOVE_MEMBER: "removed a member",
};

export function GroupActivityLog({ groupId }: { groupId: string }) {
  const { data, isLoading } = useActivities(groupId);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading activity log...</p>;
  }

  if (!data?.activities.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity logged yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.activities.map((a) => (
        <Card key={a.id}>
          <CardContent className="py-3 text-sm">
            <span className="font-medium">{a.user?.name ?? "Someone"}</span>{" "}
            <span className="text-muted-foreground">
              {LABELS[a.activityType] ?? a.activityType.toLowerCase()}
            </span>
            {a.data && typeof a.data === "object" && "description" in a.data && (
              <span className="text-muted-foreground">
                {" "}
                - {String(a.data.description)}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(a.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
