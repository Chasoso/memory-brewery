import { describe, expect, it } from "vitest";

import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../participant/experience";
import { createFixedClock } from "../../test-support/brewing";
import {
  createSnapshot,
  maximumVenueRecipes,
  mergeVenueRecipe,
  normalizeVenueRecipes,
} from "./venue-collection";
import { createVenueAggregate, venueDrawing } from "./venue-scene";

function recipe(seed: string, createdAt: string, landIndex = 0) {
  const experience = loadParticipantExperience();
  const land = experience.landMemories[landIndex];
  if (!land) throw new Error("fixture missing");
  return completeBrewingSession({
    experience,
    seed,
    clock: createFixedClock(createdAt),
    participantInput: {
      initial: {
        colorToken: landIndex === 0 ? "ferment" : "water",
        gesture: {
          kind: "summary",
          pointCount: 2,
          averageSpeed: 1,
          travelDistance: 2,
          directionChanges: 0,
          intensity: 0.2,
          density: 0.2,
        },
      },
      naka: { landMemoryId: land.id },
      tome: { scenario: "quiet-evening" },
    },
  });
}

describe("venue collection", () => {
  it("normalizes an unordered collection and treats same recipe IDs idempotently", () => {
    const older = recipe("older", "2026-07-18T00:00:00.000Z");
    const newer = recipe("newer", "2026-07-19T00:00:00.000Z", 1);
    expect(
      normalizeVenueRecipes([newer, older, newer]).map((item) => item.recipeId),
    ).toEqual([older.recipeId, newer.recipeId]);
    expect(mergeVenueRecipe([older], older).status).toBe("duplicate");
    expect(
      mergeVenueRecipe([older], { ...older, title: "different" }).status,
    ).toBe("conflict");
  });
  it("retains a deterministic bounded newest collection without mutating input", () => {
    const recipes = Array.from(
      { length: maximumVenueRecipes + 2 },
      (_, index) =>
        recipe(
          `seed-${index}`,
          `2026-07-${String((index % 9) + 10).padStart(2, "0")}T00:00:00.000Z`,
        ),
    );
    const copy = [...recipes];
    const normalized = normalizeVenueRecipes(recipes);
    expect(recipes).toEqual(copy);
    expect(normalized).toHaveLength(maximumVenueRecipes);
    expect(
      createSnapshot(normalized, "2026-07-19T00:00:00.000Z").recipes,
    ).toHaveLength(maximumVenueRecipes);
  });
  it("creates a deterministic aggregate and drawing independent of input order", () => {
    const first = recipe("first", "2026-07-18T00:00:00.000Z");
    const second = recipe("second", "2026-07-19T00:00:00.000Z", 1);
    const left = createVenueAggregate([first, second]);
    const right = createVenueAggregate([second, first]);
    expect(left).toEqual(right);
    expect(venueDrawing(left, 1280, 720, 1000, false)).toEqual(
      venueDrawing(right, 1280, 720, 1000, false),
    );
    expect(venueDrawing(left, 1280, 720, 1000, true)).not.toEqual(
      venueDrawing(left, 1280, 720, 1000, false),
    );
  });
});
