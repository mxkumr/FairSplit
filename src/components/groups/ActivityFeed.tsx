"use client";

import { useState } from "react";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EditExpenseModal } from "@/components/expenses/EditExpenseModal";
import { formatCents } from "@/lib/money";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import type { AuthUser, ExpenseItem, PaymentItem } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type ActivityItem =
  | { type: "expense"; date: string; data: ExpenseItem }
  | { type: "payment"; date: string; data: PaymentItem };

export function ActivityFeed({
  expenses,
  payments,
  groupId,
  members,
  currentUserId,
  onDeleteExpense,
}: {
  expenses: ExpenseItem[];
  payments: PaymentItem[];
  groupId: string;
  members: AuthUser[];
  currentUserId: string;
  onDeleteExpense: (expenseId: string) => void;
}) {
  const { currencySymbol } = useGroupCurrency();
  const [search, setSearch] = useState("");

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      date: e.expenseDate ?? e.createdAt,
      data: e,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      date: p.createdAt,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = search.trim()
    ? items.filter((item) => {
        const q = search.toLowerCase();
        if (item.type === "payment") {
          return (
            item.data.fromUser.name.toLowerCase().includes(q) ||
            item.data.toUser.name.toLowerCase().includes(q) ||
            (item.data.note?.toLowerCase().includes(q) ?? false)
          );
        }
        return (
          item.data.description.toLowerCase().includes(q) ||
          item.data.paidBy.name.toLowerCase().includes(q) ||
          (item.data.category?.name.toLowerCase().includes(q) ?? false) ||
          (item.data.notes?.toLowerCase().includes(q) ?? false)
        );
      })
    : items;

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search expenses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "No matching activity." : "No activity yet. Add an expense to get started."}
          </CardContent>
        </Card>
      ) : (
        filtered.map((item) => {
          if (item.type === "payment") {
            const p = item.data;
            return (
              <Card key={`payment-${p.id}`} className="border border-success/25 bg-success-muted">
                <CardContent className="flex gap-3 py-4">
                  <Avatar>
                    <AvatarFallback className="bg-success-muted text-success-foreground">
                      {getInitials(p.fromUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-success-foreground">Payment recorded</p>
                        <p className="text-sm text-success">
                          {p.fromUser.name} paid {p.toUser.name}
                        </p>
                        {p.note && (
                          <p className="text-xs text-success/80 mt-1">{p.note}</p>
                        )}
                      </div>
                      <Badge variant="success">{formatCents(p.amount, currencySymbol)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-success/80">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const expense = item.data;
          return (
            <Card key={`expense-${expense.id}`}>
              <CardContent className="flex gap-3 py-4">
                <Avatar>
                  <AvatarFallback>{getInitials(expense.paidBy.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{expense.description}</p>
                        {expense.category && (
                          <Badge variant="secondary" className="text-xs">
                            {expense.category.name}
                          </Badge>
                        )}
                        {expense.recurrenceRule !== "NONE" && (
                          <Badge variant="outline" className="text-xs">
                            Repeats {expense.recurrenceRule.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Paid by {expense.paidBy.name}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{expense.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <p className="font-semibold">{formatCents(expense.amount, currencySymbol)}</p>
                      <EditExpenseModal
                        groupId={groupId}
                        expense={expense}
                        members={members}
                        currentUserId={currentUserId}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expense.splits.map((split) => (
                      <span
                        key={split.userId}
                        className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        {split.user.name}: {formatCents(split.amountOwed, currencySymbol)}
                      </span>
                    ))}
                  </div>
                  {expense.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {expense.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          {doc.filename}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
