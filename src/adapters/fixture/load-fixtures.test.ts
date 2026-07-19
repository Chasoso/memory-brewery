import { describe, expect, it } from "vitest";

import {
  DEFAULT_SAKE_ID,
  loadFixtures,
  parseFixtureSet,
} from "./load-fixtures";

describe("fixture loader", () => {
  it("loads the complete local fixture set", () => {
    const fixtures = loadFixtures();
    expect(fixtures.sakes.length).toBeGreaterThanOrEqual(2);
    expect(fixtures.sakes.map((sake) => sake.id)).toContain(DEFAULT_SAKE_ID);
    expect(fixtures.landMemories).toHaveLength(3);
    expect(fixtures.participantInputs.length).toBeGreaterThan(1);
  });

  it("rejects duplicate IDs with a useful error", () => {
    const fixtures = loadFixtures();
    expect(() =>
      parseFixtureSet({
        ...fixtures,
        sakes: [fixtures.sakes[0], fixtures.sakes[0]],
      }),
    ).toThrow("duplicate sake ID");
  });

  it("rejects an empty fixture collection and identifies malformed fixture fields", () => {
    const fixtures = loadFixtures();
    expect(() => parseFixtureSet({ ...fixtures, sakes: [] })).toThrow(
      "Fixture validation failed",
    );
    expect(() =>
      parseFixtureSet({
        ...fixtures,
        sakes: [{ ...fixtures.sakes[0], productName: "" }],
      }),
    ).toThrow("sakes.0.productName");
  });

  it("rejects a participant input that refers to a missing land memory", () => {
    const fixtures = loadFixtures();
    expect(() =>
      parseFixtureSet({
        ...fixtures,
        participantInputs: [
          {
            ...fixtures.participantInputs[0],
            naka: { landMemoryId: "not-present" },
          },
        ],
      }),
    ).toThrow("land memory ID not found: not-present");
  });

  it("rejects a sake association that refers to a missing land memory", () => {
    const fixtures = loadFixtures();
    expect(() =>
      parseFixtureSet({
        ...fixtures,
        sakes: [
          {
            ...fixtures.sakes[0]!,
            recommendedLandMemoryIds: [
              "not-present",
              "development-land-sea-01",
            ],
          },
          fixtures.sakes[1]!,
        ],
      }),
    ).toThrow("references missing land memory ID");
  });

  it("rejects duplicate land recommendations while preserving valid fixture order", () => {
    const fixtures = loadFixtures();
    expect(fixtures.sakes[0]!.recommendedLandMemoryIds).toEqual([
      "development-land-snow-01",
      "development-land-town-01",
      "development-land-sea-01",
    ]);
    expect(() =>
      parseFixtureSet({
        ...fixtures,
        sakes: [
          {
            ...fixtures.sakes[0]!,
            recommendedLandMemoryIds: [
              "development-land-snow-01",
              "development-land-snow-01",
            ],
          },
          fixtures.sakes[1]!,
        ],
      }),
    ).toThrow("recommendedLandMemoryIds");
  });
});
