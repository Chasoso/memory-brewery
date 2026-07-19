import { describe, expect, it } from "vitest";

import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import { loadParticipantExperience } from "./experience";
import { loadParticipantEntry } from "./participant-entry";
import { DEFAULT_SAKE_ID, resolveSakeSelection } from "./sake-selection";

describe("sake entry selection", () => {
  const fixtures = loadFixtures();

  it("uses the explicit default instead of fixture order", () => {
    const reversed = { sakes: [...fixtures.sakes].reverse() };
    const selection = resolveSakeSelection(new URLSearchParams(), reversed);
    expect(selection.status).toBe("defaulted");
    if (selection.status === "defaulted")
      expect(selection.sake.id).toBe(DEFAULT_SAKE_ID);
  });

  it("selects a known case-sensitive trimmed ID", () => {
    const selection = resolveSakeSelection(
      new URLSearchParams("sake_id=%20development-sake-water-02%20"),
      fixtures,
    );
    expect(selection).toMatchObject({
      status: "selected",
      sake: { id: "development-sake-water-02" },
    });
    expect(
      resolveSakeSelection(
        new URLSearchParams("sake_id=DEVELOPMENT-SAKE-WATER-02"),
        fixtures,
      ).status,
    ).toBe("invalid");
  });

  it("keeps unknown, empty, malformed, and multiple values distinct from the default", () => {
    expect(
      resolveSakeSelection(
        new URLSearchParams("sake_id=unknown-sake"),
        fixtures,
      ),
    ).toMatchObject({ status: "unknown" });
    expect(
      resolveSakeSelection(new URLSearchParams("sake_id="), fixtures).status,
    ).toBe("invalid");
    expect(
      resolveSakeSelection(new URLSearchParams("sake_id=bad%01id"), fixtures)
        .status,
    ).toBe("invalid");
    expect(
      resolveSakeSelection(
        new URLSearchParams(
          "sake_id=development-sake-snow-01&sake_id=development-sake-water-02",
        ),
        fixtures,
      ).status,
    ).toBe("invalid");
  });

  it("resolves sake-specific land candidates in their declared order", () => {
    const snow = loadParticipantExperience("development-sake-snow-01");
    const water = loadParticipantExperience("development-sake-water-02");
    expect(snow.landMemories.map((land) => land.id)).toEqual(
      snow.sake.recommendedLandMemoryIds,
    );
    expect(water.landMemories.map((land) => land.id)).toEqual(
      water.sake.recommendedLandMemoryIds,
    );
    expect(water.landMemories.map((land) => land.id)).not.toEqual(
      snow.landMemories.map((land) => land.id),
    );
  });

  it("does not start a participant experience for an unknown entry", () => {
    expect(loadParticipantEntry("?sake_id=unknown-sake")).toMatchObject({
      status: "unknown",
    });
    expect(loadParticipantEntry("")).toMatchObject({
      status: "defaulted",
      experience: { sake: { id: DEFAULT_SAKE_ID } },
    });
  });
});
