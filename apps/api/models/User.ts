import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    householdId: { type: Types.ObjectId, ref: "Household", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = models.User ?? model("User", userSchema);
