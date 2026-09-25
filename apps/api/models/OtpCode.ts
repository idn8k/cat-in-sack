import { Schema, model, models, type InferSchemaType } from "mongoose";

const otpCodeSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type OtpCodeDocument = InferSchemaType<typeof otpCodeSchema>;

export const OtpCode = models.OtpCode ?? model("OtpCode", otpCodeSchema);
