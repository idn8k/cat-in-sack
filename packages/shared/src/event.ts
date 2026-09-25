import { z } from "zod";

export const eventTypeSchema = z.enum(["VET", "GROOMING", "DAYCARE", "WEIGHT"]);
export type EventType = z.infer<typeof eventTypeSchema>;

export const eventSchema = z
  .object({
    id: z.string(),
    felineId: z.string(),
    type: eventTypeSchema,
    date: z.coerce.date(),
    location: z.string().optional(),
    provider: z.string().optional(),
    notes: z.string().optional(),
    valueKg: z.number().positive().optional(),
    // Unused until Phase 2 (recurring events).
    recurrenceRule: z.string().optional(),
    createdAt: z.coerce.date(),
  })
  .refine((event) => event.type !== "WEIGHT" || event.valueKg !== undefined, {
    message: "valueKg is required for WEIGHT events",
    path: ["valueKg"],
  });

export type Event = z.infer<typeof eventSchema>;
