import { describe, expect, it } from "vitest";

import { createBrewingRecipe } from "../../domain/brewing/create-brewing-recipe";
import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import { createFixedClock } from "../../test-support/brewing";
import {
  initialParticipantFlowState,
  participantFlowReducer,
  type ParticipantFlowState,
} from "./flow";

describe("participant flow state", () => {
  const summary = {
    kind: "summary" as const,
    pointCount: 4,
    averageSpeed: 20,
    travelDistance: 40,
    directionChanges: 1,
    intensity: 0.3,
    density: 0.2,
  };

  it("enforces the ordered flow and resets without allowing skips", () => {
    let state = initialParticipantFlowState;
    state = participantFlowReducer(state, { type: "finish-odori" });
    expect(state.step).toBe("intro");
    state = participantFlowReducer(state, { type: "start" });
    state = participantFlowReducer(state, { type: "start-odori" });
    expect(state.step).toBe("initial");
    state = participantFlowReducer(state, {
      type: "set-gesture",
      gesture: summary,
    });
    state = participantFlowReducer(state, { type: "start-odori" });
    state = participantFlowReducer(state, { type: "finish-odori" });
    expect(state.step).toBe("naka");
    state = participantFlowReducer(state, { type: "to-tome" });
    expect(state.step).toBe("naka");
    state = participantFlowReducer(state, {
      type: "set-land",
      landMemoryId: "development-land-snow-01",
    });
    state = participantFlowReducer(state, { type: "to-tome" });
    expect(state.step).toBe("tome");
    expect(participantFlowReducer(state, { type: "reset" })).toEqual(
      initialParticipantFlowState,
    );
  });

  it("accepts only an explicit recipe result after the tome step", () => {
    const fixtures = loadFixtures();
    const sake = fixtures.sakes[0]!;
    const land = fixtures.landMemories[0]!;
    const recipe = createBrewingRecipe({
      sake,
      landMemory: land,
      participantInput: {
        initial: { colorToken: "ferment", gesture: summary },
        naka: { landMemoryId: land.id },
        tome: { scenario: "quiet-evening" },
      },
      seed: "flow",
      clock: createFixedClock(),
    });
    let state: ParticipantFlowState = {
      ...initialParticipantFlowState,
      step: "tome" as const,
    };
    state = participantFlowReducer(state, { type: "set-result", recipe });
    expect(state.step).toBe("result");
    expect(state.recipe).toEqual(recipe);
  });
});
