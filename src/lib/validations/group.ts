import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  memberIds: z.array(z.string()).optional().default([]),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
