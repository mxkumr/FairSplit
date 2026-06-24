"use client";

import Link from "next/link";
import { Bookmark, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCents } from "@/lib/money";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatGroupDate, getGroupCoverClass } from "@/lib/group-cover";
import { cn } from "@/lib/utils";
import type { GroupSummary } from "@/lib/api-client";

export function FeaturedGroupCard({
  group,
  netAmount,
}: {
  group: GroupSummary;
  netAmount: number;
}) {
  const currencySymbol = getCurrencySymbol(group.currency);
  const { day, month } = formatGroupDate(group.createdAt);
  const cover = getGroupCoverClass(group.id);

  return (
    <Link href={`/groups/${group.id}`} className="block group">
      <div className="overflow-hidden rounded-3xl bg-card shadow-soft border border-border/50 transition-transform hover:scale-[1.01]">
        <div className={cn("relative h-52 bg-gradient-to-br sm:h-64", cover)}>
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            {group.memberCount} members
          </div>
          {group.isFavorite && (
            <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full glass">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-card p-4 sm:p-5">
            <div className="flex items-end gap-3">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <span className="text-lg font-bold leading-none">{day}</span>
                <span className="text-[10px] font-semibold uppercase">{month}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{group.name}</h3>
                <p className="truncate text-sm text-muted-foreground">
                  {group.information || `${group._count.expenses} expenses · ${group.currency}`}
                </p>
              </div>
              {netAmount !== 0 && (
                <p
                  className={cn(
                    "shrink-0 text-lg font-bold",
                    netAmount > 0 ? "text-success" : "text-brand",
                  )}
                >
                  {netAmount > 0 ? "+" : ""}
                  {formatCents(netAmount, currencySymbol)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function OngoingSplitCard({
  group,
  netAmount,
}: {
  group: GroupSummary;
  netAmount: number;
}) {
  const currencySymbol = getCurrencySymbol(group.currency);
  const cover = getGroupCoverClass(group.id);

  return (
    <Link href={`/groups/${group.id}`} className="block">
      <div className="flex gap-4 rounded-3xl bg-card p-4 shadow-soft border border-border/50 transition-colors hover:bg-muted/50">
        <div className={cn("h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br", cover)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold">{group.name}</h3>
            <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.memberCount} members · {group._count.expenses} expenses
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(group.memberCount, 4) }).map((_, i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-card">
                  <AvatarFallback className="bg-muted text-[10px] font-bold">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {netAmount !== 0 ? (
              <div className="text-right">
                <p className="text-[10px] font-medium text-muted-foreground">Payable amount</p>
                <p className="font-bold text-brand">
                  {formatCents(Math.abs(netAmount), currencySymbol)}
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold text-success">All settled</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
