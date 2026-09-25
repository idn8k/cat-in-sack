import { computeDepletionDate, isReorderDue } from "@cat-in-sack/shared";
import type { HydratedDocument } from "mongoose";
import type { InventoryDocument } from "../../../models/Inventory";

export function serializeInventory(item: HydratedDocument<InventoryDocument>) {
  const now = new Date();
  const depletionDate = computeDepletionDate(item.totalAmount, item.dailyBurnRate, now);

  return {
    id: item._id.toString(),
    householdId: item.householdId.toString(),
    type: item.type,
    totalAmount: item.totalAmount,
    dailyBurnRate: item.dailyBurnRate,
    reorderThresholdDays: item.reorderThresholdDays,
    createdAt: item.createdAt,
    depletionDate,
    reorderDue: isReorderDue(depletionDate, item.reorderThresholdDays, now),
  };
}
