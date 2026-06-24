"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useQueryClient } from "@tanstack/react-query";
import { refetchGroupData, useCreateExpense } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/api-client";

export function AddExpenseModal({
  groupId,
  members,
  currentUserId,
  variant = "default",
  fabClassName,
}: {
  groupId: string;
  members: AuthUser[];
  currentUserId: string;
  variant?: "default" | "fab" | "brand";
  fabClassName?: string;
}) {
  const { currencySymbol } = useGroupCurrency();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const createExpense = useCreateExpense(groupId);

  const trigger =
    variant === "fab" ? (
      fabClassName ? (
        <button type="button" className={fabClassName} aria-label="Add expense">
          <Plus className="h-6 w-6" />
        </button>
      ) : (
        <Button
          size="icon"
          variant="brand"
          className="h-14 w-14 rounded-full shadow-float gradient-brand text-brand-foreground"
          aria-label="Add expense"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )
    ) : (
      <Button
        variant={variant === "brand" ? "brand" : "default"}
        className={cn(variant === "default" && "w-full")}
      >
        Add Expense
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setFile(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a new expense and split it among members.</DialogDescription>
        </DialogHeader>
        <ExpenseForm
          members={members}
          currentUserId={currentUserId}
          currencySymbol={currencySymbol}
          isPending={createExpense.isPending}
          submitLabel="Save Expense"
          onFileSelect={setFile}
          onSubmit={async (values) => {
            const result = await createExpense.mutateAsync(values);
            if (file) {
              await api.uploadExpenseDocument(groupId, result.expense.id, file);
              await refetchGroupData(queryClient, groupId);
            }
            setFile(null);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
