import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import { systemClock, type Clock } from "../../domain/brewing/clock";
import { createBrewingRecipe } from "../../domain/brewing/create-brewing-recipe";
import {
  ParticipantInputSchema,
  type BrewingRecipe,
  type FixtureSet,
} from "../../domain/brewing/schemas";
import { DEFAULT_SAKE_ID } from "./sake-selection";

export type ParticipantExperience = Pick<
  FixtureSet,
  "sakes" | "landMemories"
> & { sake: FixtureSet["sakes"][number] };

export function loadParticipantExperience(
  sakeId = DEFAULT_SAKE_ID,
): ParticipantExperience {
  const fixtures = loadFixtures();
  const sake = fixtures.sakes.find((candidate) => candidate.id === sakeId);
  if (sake === undefined) {
    throw new Error(`Sake fixture is not available: ${sakeId}`);
  }
  const landMemories = sake.recommendedLandMemoryIds.map((landMemoryId) => {
    const landMemory = fixtures.landMemories.find(
      (candidate) => candidate.id === landMemoryId,
    );
    if (landMemory === undefined) {
      throw new Error(
        `Sake fixture references unavailable land memory: ${landMemoryId}`,
      );
    }
    return landMemory;
  });
  return { sake, sakes: fixtures.sakes, landMemories };
}

export function completeBrewingSession(input: {
  experience: ParticipantExperience;
  participantInput: unknown;
  seed: string;
  clock?: Clock;
}): BrewingRecipe {
  const participantInput = ParticipantInputSchema.parse(input.participantInput);
  const landMemory = input.experience.landMemories.find(
    (candidate) => candidate.id === participantInput.naka.landMemoryId,
  );
  if (landMemory === undefined) {
    throw new Error(
      "Selected land memory is not available in this experience.",
    );
  }

  return createBrewingRecipe({
    sake: input.experience.sake,
    landMemory,
    participantInput,
    seed: input.seed,
    clock: input.clock ?? systemClock,
  });
}
