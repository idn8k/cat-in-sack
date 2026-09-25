import { z } from "zod";

export const inventoryTypeSchema = z.enum(["FOOD", "LITTER", "MEDS"]);
export type InventoryType = z.infer<typeof inventoryTypeSchema>;

export const inventorySchema = z.object({
  id: z.string(),
  householdId: z.string(),
  type: inventoryTypeSchema,
  // Unit depends on `type` (e.g. kg for FOOD/LITTER, dose count for MEDS).
  totalAmount: z.number().nonnegative(),
  dailyBurnRate: z.number().positive(),
  reorderThresholdDays: z.number().int().positive().default(3),
  createdAt: z.coerce.date(),
});

export type Inventory = z.infer<typeof inventorySchema>;
