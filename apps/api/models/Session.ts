import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SessionDocument = InferSchemaType<typeof sessionSchema>;

export const Session = models.Session ?? model("Session", sessionSchema);
