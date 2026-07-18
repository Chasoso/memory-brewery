import { describe, expect, it } from "vitest";

import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import { createBrewingRecipe } from "./create-brewing-recipe";
import {
  BrewingRecipeSchema,
  LandMemorySchema,
  ParticipantInputSchema,
  SakeProfileSchema,
} from "./schemas";
import { createFixedClock } from "../../test-support/brewing";

describe("brewing schemas", () => {
  const fixtures = loadFixtures();
  const sake = fixtures.sakes[0]!;
  const land = fixtures.landMemories[0]!;
  const participantInput = fixtures.participantInputs[0]!;

  it("accepts validated fixture models", () => {
    expect(SakeProfileSchema.safeParse(sake).success).toBe(true);
    expect(LandMemorySchema.safeParse(land).success).toBe(true);
    expect(ParticipantInputSchema.safeParse(participantInput).success).toBe(
      true,
    );
  });

  it("rejects empty IDs and invalid sake numeric ranges", () => {
    expect(SakeProfileSchema.safeParse({ ...sake, id: "" }).success).toBe(
      false,
    );
    expect(
      SakeProfileSchema.safeParse({ ...sake, productName: undefined }).success,
    ).toBe(false);
    expect(
      SakeProfileSchema.safeParse({ ...sake, polishingRatio: -1 }).success,
    ).toBe(false);
    expect(
      SakeProfileSchema.safeParse({ ...sake, alcoholPercentage: 101 }).success,
    ).toBe(false);
  });

  it("rejects invalid land and participant input", () => {
    expect(LandMemorySchema.safeParse({ ...land, tags: [] }).success).toBe(
      false,
    );
    expect(
      LandMemorySchema.safeParse({ ...land, tags: ["not-a-tag"] }).success,
    ).toBe(false);
    expect(
      LandMemorySchema.safeParse({ ...land, displayName: "" }).success,
    ).toBe(false);

    expect(
      ParticipantInputSchema.safeParse({
        ...participantInput,
        tome: { freeText: "x".repeat(121) },
      }).success,
    ).toBe(false);
    expect(
      ParticipantInputSchema.safeParse({
        ...participantInput,
        tome: { freeText: "\u0001" },
      }).success,
    ).toBe(false);
  });

  it("rejects invalid numeric recipe values", () => {
    const recipe = createBrewingRecipe({
      sake,
      landMemory: land,
      participantInput,
      seed: "schema-test",
      clock: createFixedClock(),
    });
    expect(
      BrewingRecipeSchema.safeParse({
        ...recipe,
        audio: { ...recipe.audio, tempo: Number.NaN },
      }).success,
    ).toBe(false);
  });
});
