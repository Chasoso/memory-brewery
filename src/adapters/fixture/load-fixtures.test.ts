import { describe, expect, it } from "vitest";

import { loadFixtures, parseFixtureSet } from "./load-fixtures";

describe("fixture loader", () => {
  it("loads the complete local fixture set", () => {
    const fixtures = loadFixtures();
    expect(fixtures.sakes).toHaveLength(1);
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
});
