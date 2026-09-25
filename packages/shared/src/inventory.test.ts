import { describe, expect, it } from "vitest";
import { computeDepletionDate, isReorderDue } from "./inventory";

describe("computeDepletionDate", () => {
  it("computes the date the item runs out at its burn rate", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(computeDepletionDate(10, 2, from)).toEqual(new Date("2026-01-06T00:00:00.000Z"));
  });

  it("handles fractional days of runway", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(computeDepletionDate(5, 2, from)).toEqual(new Date("2026-01-03T12:00:00.000Z"));
  });

  it("never depletes at a zero or negative burn rate", () => {
    expect(computeDepletionDate(10, 0)).toBeNull();
    expect(computeDepletionDate(10, -1)).toBeNull();
  });
});

describe("isReorderDue", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");

  it("is false when depletion is beyond the threshold", () => {
    expect(isReorderDue(new Date("2026-01-10T00:00:00.000Z"), 3, from)).toBe(false);
  });

  it("is true right at the threshold boundary", () => {
    expect(isReorderDue(new Date("2026-01-04T00:00:00.000Z"), 3, from)).toBe(true);
  });

  it("is true once the item has already depleted", () => {
    expect(isReorderDue(new Date("2025-12-20T00:00:00.000Z"), 3, from)).toBe(true);
  });

  it("is false for an item that never depletes", () => {
    expect(isReorderDue(null, 3, from)).toBe(false);
  });
});
