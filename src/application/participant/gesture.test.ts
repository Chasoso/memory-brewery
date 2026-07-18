import { describe, expect, it } from "vitest";

import { appendGesturePoint, summarizeGesture } from "./gesture";

describe("gesture normalization", () => {
  it("creates a schema-compatible summary from pointer samples", () => {
    const summary = summarizeGesture([
      { x: 0, y: 0, at: 0 },
      { x: 40, y: 0, at: 100 },
      { x: 40, y: 40, at: 200 },
    ]);

    expect(summary).toMatchObject({ kind: "summary", pointCount: 3 });
    if (summary.kind === "summary") {
      expect(summary.travelDistance).toBeGreaterThan(8);
      expect(summary.directionChanges).toBe(1);
      expect(Number.isFinite(summary.averageSpeed)).toBe(true);
    }
  });

  it("rejects taps and never produces NaN or Infinity", () => {
    expect(summarizeGesture([{ x: 10, y: 10, at: 0 }])).toEqual({
      kind: "none",
    });
    expect(
      summarizeGesture([
        { x: 10, y: 10, at: 0 },
        { x: 10, y: 10, at: 0 },
      ]),
    ).toEqual({ kind: "none" });
  });

  it("caps retained pointer samples without mutating its input", () => {
    const points = Array.from({ length: 400 }, (_, index) => ({
      x: index,
      y: index,
      at: index,
    }));
    const original = [...points];
    const next = appendGesturePoint(points, { x: 500, y: 500, at: 500 });

    expect(next.length).toBeLessThanOrEqual(256);
    expect(points).toEqual(original);
  });
});
