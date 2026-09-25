import { Schema, model, models, type InferSchemaType } from "mongoose";

const householdSchema = new Schema(
  {},
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type HouseholdDocument = InferSchemaType<typeof householdSchema>;

export const Household = models.Household ?? model("Household", householdSchema);
