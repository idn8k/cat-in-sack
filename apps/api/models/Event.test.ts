import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { Event } from "./Event";

describe("Event model — valueKg", () => {
  it("rejects 0, matching the shared Zod contract's .positive()", () => {
    const doc = new Event({
      felineId: new Types.ObjectId(),
      type: "WEIGHT",
      date: new Date(),
      valueKg: 0,
    });

    const error = doc.validateSync();

    expect(error?.errors.valueKg).toBeDefined();
  });

  it("accepts a positive value", () => {
    const doc = new Event({
      felineId: new Types.ObjectId(),
      type: "WEIGHT",
      date: new Date(),
      valueKg: 4.2,
    });

    expect(doc.validateSync()).toBeUndefined();
  });
});
