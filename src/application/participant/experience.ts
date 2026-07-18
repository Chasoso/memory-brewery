import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import { systemClock, type Clock } from "../../domain/brewing/clock";
import { createBrewingRecipe } from "../../domain/brewing/create-brewing-recipe";
import {
  ParticipantInputSchema,
  type BrewingRecipe,
  type FixtureSet,
} from "../../domain/brewing/schemas";

export type ParticipantExperience = Pick<
  FixtureSet,
  "sakes" | "landMemories"
> & { sake: FixtureSet["sakes"][number] };

export function loadParticipantExperience(): ParticipantExperience {
  const fixtures = loadFixtures();
  const sake = fixtures.sakes[0];
  if (sake === undefined) {
    throw new Error("Participant experience requires one sake fixture.");
  }
  return { sake, sakes: fixtures.sakes, landMemories: fixtures.landMemories };
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
