import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  information: z.string().max(1000).optional(),
  currency: z.string().max(10).optional().default("USD"),
  currencySymbol: z.string().max(5).optional().default("$"),
  memberIds: z.array(z.string()).optional().default([]),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  information: z.string().max(1000).optional().nullable(),
  currency: z.string().max(10).optional(),
  currencySymbol: z.string().max(5).optional(),
  settlementMode: z.enum(["simplified", "direct"]).optional(),
});

export const addMemberSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    userId: z.string().min(1).optional(),
  })
  .refine((data) => data.email || data.userId, {
    message: "Email or user ID is required",
  });

export const recordPaymentSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().int().positive("Amount must be a positive integer (cents)"),
  note: z.string().max(200).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
