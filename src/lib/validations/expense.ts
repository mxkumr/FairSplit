import { z } from "zod";

export const expenseSplitSchema = z.object({
  userId: z.string().min(1),
  amountOwed: z.number().int().positive(),
  shares: z.number().int().positive().optional().default(1),
});

export const splitModeSchema = z.enum(["EVENLY", "BY_SHARES", "BY_PERCENTAGE", "BY_AMOUNT"]);

export const recurrenceRuleSchema = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]);

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(200),
    amount: z.number().int().positive("Amount must be a positive integer (cents)"),
    paidByUserId: z.string().min(1),
    expenseDate: z.string().optional(),
    categoryId: z.number().int().optional().nullable(),
    splitMode: splitModeSchema.optional().default("EVENLY"),
    notes: z.string().max(500).optional(),
    isReimbursement: z.boolean().optional().default(false),
    recurrenceRule: recurrenceRuleSchema.optional().default("NONE"),
    splits: z.array(expenseSplitSchema).min(1, "At least one split is required"),
  })
  .refine(
    (data) => {
      const total = data.splits.reduce((sum, s) => sum + s.amountOwed, 0);
      return total === data.amount;
    },
    { message: "Split amounts must sum to the total expense amount", path: ["splits"] },
  );

export const updateExpenseSchema = createExpenseSchema;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
