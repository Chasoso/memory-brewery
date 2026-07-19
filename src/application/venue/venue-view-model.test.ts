import { describe, expect, it } from "vitest";

import { createVenueLandSummaries } from "./venue-view-model";

describe("venue land view model", () => {
  it("resolves fixture IDs and safely hides unknown IDs", () => {
    const summaries = createVenueLandSummaries({
      count: 2,
      paletteCounts: {},
      marks: [],
      landCounts: { "development-land-snow-light": 1, unknown: 1 },
    });
    expect(summaries.find((item) => item.count === 1)?.displayName).not.toBe(
      "development-land-snow-light",
    );
    expect(summaries.some((item) => item.displayName === "土地の記憶")).toBe(
      true,
    );
  });
});
