"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { ExpenseItem } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ExpenseTimeline({ expenses }: { expenses: ExpenseItem[] }) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses yet. Add one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardContent className="flex gap-3 py-4">
            <Avatar>
              <AvatarFallback>{getInitials(expense.paidBy.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Paid by {expense.paidBy.name}
                  </p>
                </div>
                <p className="font-semibold shrink-0">{formatCents(expense.amount)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {expense.splits.map((split) => (
                  <span
                    key={split.userId}
                    className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    {split.user.name}: {formatCents(split.amountOwed)}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(expense.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
