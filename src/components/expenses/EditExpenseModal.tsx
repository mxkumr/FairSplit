"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useGroupCurrency } from "@/components/groups/GroupCurrencyContext";
import { useUpdateExpense } from "@/hooks/use-api";
import type { AuthUser, ExpenseItem } from "@/lib/api-client";

export function EditExpenseModal({
  groupId,
  expense,
  members,
  currentUserId,
  trigger,
}: {
  groupId: string;
  expense: ExpenseItem;
  members: AuthUser[];
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const { currencySymbol } = useGroupCurrency();
  const [open, setOpen] = useState(false);
  const updateExpense = useUpdateExpense(groupId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Update this expense and its splits.</DialogDescription>
        </DialogHeader>
        {open && (
          <ExpenseForm
            members={members}
            currentUserId={currentUserId}
            currencySymbol={currencySymbol}
            initial={{
              description: expense.description,
              amount: expense.amount,
              paidByUserId: expense.paidBy.id,
              expenseDate: expense.expenseDate ?? expense.createdAt,
              categoryId: expense.categoryId,
              notes: expense.notes,
              recurrenceRule: expense.recurrenceRule,
              splits: expense.splits.map((s) => ({
                userId: s.userId,
                amountOwed: s.amountOwed,
                shares: s.shares,
              })),
            }}
            isPending={updateExpense.isPending}
            submitLabel="Update Expense"
            onSubmit={async (values) => {
              await updateExpense.mutateAsync({ expenseId: expense.id, ...values });
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
