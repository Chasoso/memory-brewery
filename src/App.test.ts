import { describe, expect, it } from "vitest";

import { getParticipantTestConfiguration } from "./application/participant/test-configuration";

describe("participant E2E configuration", () => {
  it("does not enable fixed test dependencies from a query parameter alone", () => {
    expect(getParticipantTestConfiguration("?test=1", false)).toBeUndefined();
  });

  it("enables deterministic dependencies only for explicit E2E mode and query", () => {
    const configuration = getParticipantTestConfiguration("?test=1", true);

    expect(configuration?.seed).toBe("e2e-fixed-seed");
    expect(configuration?.odoriDurationMs).toBe(10);
    expect(configuration?.clock.now()).toBe("2026-07-18T00:00:00.000Z");
  });
});
