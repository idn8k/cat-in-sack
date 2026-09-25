import { z } from "zod";

export const felineSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  breed: z.string().optional(),
  targetWeightKg: z.number().positive().optional(),
  dietaryRestrictions: z.string().optional(),
  createdAt: z.coerce.date(),
});

export type Feline = z.infer<typeof felineSchema>;

export const felineListSchema = z.array(felineSchema);

export const createFelineSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  breed: z.string().min(1).optional(),
  targetWeightKg: z.number().positive().optional(),
  dietaryRestrictions: z.string().min(1).optional(),
});

export type CreateFelineInput = z.infer<typeof createFelineSchema>;
