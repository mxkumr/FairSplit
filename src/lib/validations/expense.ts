import { z } from "zod";

export const expenseSplitSchema = z.object({
  userId: z.string().min(1),
  amountOwed: z.number().int().positive(),
});

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(200),
    amount: z.number().int().positive("Amount must be a positive integer (cents)"),
    paidByUserId: z.string().min(1),
    splits: z.array(expenseSplitSchema).min(1, "At least one split is required"),
  })
  .refine(
    (data) => {
      const total = data.splits.reduce((sum, s) => sum + s.amountOwed, 0);
      return total === data.amount;
    },
    { message: "Split amounts must sum to the total expense amount", path: ["splits"] },
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
