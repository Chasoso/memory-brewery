import { describe, expect, it } from "vitest";

import {
  loadParticipantExperience,
  completeBrewingSession,
} from "../participant/experience";
import { createFixedClock } from "../../test-support/brewing";
import { createOpeningDrawing, createOpeningScene } from "./visual-model";

function recipeFor(seed: string) {
  const experience = loadParticipantExperience();
  const landMemoryId = experience.landMemories[0]?.id;
  if (landMemoryId === undefined) throw new Error("Expected a land fixture.");
  return completeBrewingSession({
    experience,
    seed,
    clock: createFixedClock(),
    participantInput: {
      initial: {
        colorToken: "ferment",
        gesture: {
          kind: "summary",
          pointCount: 3,
          averageSpeed: 10,
          travelDistance: 24,
          directionChanges: 1,
          intensity: 0.4,
          density: 0.4,
        },
      },
      naka: { landMemoryId },
      tome: { scenario: "quiet-evening" },
    },
  });
}

describe("opening visual model", () => {
  it("is deterministic for one recipe, size, and elapsed time", () => {
    const recipe = recipeFor("opening-seed");
    const configuration = {
      width: 320,
      height: 250,
      elapsedMs: 7200,
      reducedMotion: false,
    };
    expect(createOpeningDrawing(recipe, configuration)).toEqual(
      createOpeningDrawing(recipe, configuration),
    );
  });

  it("changes some stable scene state with a different recipe seed", () => {
    expect(createOpeningScene(recipeFor("opening-a"))).not.toEqual(
      createOpeningScene(recipeFor("opening-b")),
    );
  });

  it("uses elapsed time, keeps values finite, and caps element count", () => {
    const recipe = recipeFor("opening-time");
    const before = createOpeningDrawing(recipe, {
      width: 320,
      height: 250,
      elapsedMs: 0,
      reducedMotion: false,
    });
    const later = createOpeningDrawing(recipe, {
      width: 320,
      height: 250,
      elapsedMs: 1400,
      reducedMotion: false,
    });
    expect(later.marks).not.toEqual(before.marks);
    expect(later.marks.length).toBeLessThanOrEqual(120);
    later.marks.forEach((mark) => {
      expect(Number.isFinite(mark.x)).toBe(true);
      expect(Number.isFinite(mark.y)).toBe(true);
      expect(Number.isFinite(mark.alpha)).toBe(true);
    });
  });

  it("suppresses movement while retaining the same artwork under reduced motion", () => {
    const recipe = recipeFor("opening-motion");
    const normal = createOpeningDrawing(recipe, {
      width: 320,
      height: 250,
      elapsedMs: 2500,
      reducedMotion: false,
    });
    const reduced = createOpeningDrawing(recipe, {
      width: 320,
      height: 250,
      elapsedMs: 2500,
      reducedMotion: true,
    });
    expect(reduced.marks.length).toBe(normal.marks.length);
    expect(reduced.marks).not.toEqual(normal.marks);
  });
});
