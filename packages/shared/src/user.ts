import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  householdId: z.string(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;
