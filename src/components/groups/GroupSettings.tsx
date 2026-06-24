"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareGroupInviteButton } from "@/components/groups/ShareGroupInviteButton";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateGroup } from "@/hooks/use-api";
import { getCurrencySymbol } from "@/lib/currencies";
import type { GroupDetail } from "@/lib/api-client";

export function GroupSettings({
  group,
  groupId,
}: {
  group: GroupDetail;
  groupId: string;
}) {
  const [name, setName] = useState(group.name);
  const [information, setInformation] = useState(group.information ?? "");
  const [currency, setCurrency] = useState(group.currency);
  const [currencySymbol, setCurrencySymbol] = useState(group.currencySymbol);
  const [error, setError] = useState<string | null>(null);
  const updateGroup = useUpdateGroup(groupId);

  useEffect(() => {
    setName(group.name);
    setInformation(group.information ?? "");
    setCurrency(group.currency);
    setCurrencySymbol(group.currencySymbol);
  }, [group.name, group.information, group.currency, group.currencySymbol]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateGroup.mutateAsync({
        name: name.trim(),
        information: information.trim() || null,
        currency,
        currencySymbol,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Group settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ShareGroupInviteButton groupId={groupId} variant="button" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-info">Description</Label>
            <Input
              id="group-info"
              value={information}
              onChange={(e) => setInformation(e.target.value)}
              placeholder="Optional group description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <CurrencySelect
              id="currency"
              value={currency}
              onChange={(code, symbol) => {
                setCurrency(code);
                setCurrencySymbol(symbol);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Symbol: {currencySymbol || getCurrencySymbol(currency)}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={updateGroup.isPending}>
            {updateGroup.isPending ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
