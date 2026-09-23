import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const felineSchema = new Schema(
  {
    householdId: { type: Types.ObjectId, ref: "Household", required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    breed: { type: String },
    targetWeightKg: { type: Number, min: 0 },
    dietaryRestrictions: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type FelineDocument = InferSchemaType<typeof felineSchema>;

export const Feline = models.Feline ?? model("Feline", felineSchema);
