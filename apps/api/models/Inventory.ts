import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const INVENTORY_TYPES = ["FOOD", "LITTER", "MEDS"] as const;

const inventorySchema = new Schema(
  {
    householdId: { type: Types.ObjectId, ref: "Household", required: true },
    type: { type: String, enum: INVENTORY_TYPES, required: true },
    // Unit depends on `type` (e.g. kg for FOOD/LITTER, dose count for MEDS).
    totalAmount: { type: Number, required: true, min: 0 },
    dailyBurnRate: { type: Number, required: true, min: 0 },
    reorderThresholdDays: { type: Number, required: true, default: 3, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type InventoryDocument = InferSchemaType<typeof inventorySchema>;

export const Inventory = models.Inventory ?? model("Inventory", inventorySchema);
