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

// The API always attaches the computed depletion/reorder signal (CONTEXT.md: "computed
// from depletion date, not a second independent rule") — never trust a client-sent value.
export const inventoryWithStatusSchema = inventorySchema.extend({
  depletionDate: z.coerce.date().nullable(),
  reorderDue: z.boolean(),
});
export type InventoryWithStatus = z.infer<typeof inventoryWithStatusSchema>;

export const inventoryListSchema = z.array(inventoryWithStatusSchema);

export const createInventorySchema = z.object({
  type: inventoryTypeSchema,
  totalAmount: z.number().nonnegative(),
  dailyBurnRate: z.number().positive(),
  reorderThresholdDays: z.number().int().positive().default(3),
});
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

// No `.partial()` off createInventorySchema: that would keep reorderThresholdDays'
// `.default(3)`, which re-applies on every partial update that omits it.
export const updateInventorySchema = z.object({
  type: inventoryTypeSchema.optional(),
  totalAmount: z.number().nonnegative().optional(),
  dailyBurnRate: z.number().positive().optional(),
  reorderThresholdDays: z.number().int().positive().optional(),
});
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

/**
 * Pure, DB-independent depletion calc: total amount and a daily burn rate determine the
 * date an item runs out. A non-positive burn rate never depletes.
 */
export function computeDepletionDate(
  totalAmount: number,
  dailyBurnRate: number,
  from: Date = new Date(),
): Date | null {
  if (dailyBurnRate <= 0) {
    return null;
  }

  const daysRemaining = totalAmount / dailyBurnRate;
  return new Date(from.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
}

/**
 * The reorder alert: whether a computed depletion date falls within the reorder
 * threshold (including an item that has already depleted).
 */
export function isReorderDue(depletionDate: Date | null, reorderThresholdDays: number, from: Date = new Date()): boolean {
  if (depletionDate === null) {
    return false;
  }

  const thresholdMs = reorderThresholdDays * 24 * 60 * 60 * 1000;
  return depletionDate.getTime() - from.getTime() <= thresholdMs;
}
