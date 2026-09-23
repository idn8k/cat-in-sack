import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const EVENT_TYPES = ["VET", "GROOMING", "DAYCARE", "WEIGHT"] as const;

const eventSchema = new Schema(
  {
    felineId: { type: Types.ObjectId, ref: "Feline", required: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    provider: { type: String },
    notes: { type: String },
    valueKg: { type: Number, min: 0 },
    // Unused until Phase 2 (recurring events) — see docs/BUILD_PLAN.md.
    recurrenceRule: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type EventDocument = InferSchemaType<typeof eventSchema>;

export const Event = models.Event ?? model("Event", eventSchema);
