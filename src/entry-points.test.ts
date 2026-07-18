import { describe, expect, it } from "vitest";

import { participantEntryPath, venueEntryPath } from "./entry-points";

describe("application entry points", () => {
  it("declares the participant and venue entry paths", () => {
    expect(participantEntryPath).toBe("/");
    expect(venueEntryPath).toBe("/venue.html");
  });
});
