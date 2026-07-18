import { describe, expect, it, vi } from "vitest";

import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import {
  createFixedClock,
  createFixedSeededRandom,
} from "../../test-support/brewing";
import { createBrewingRecipe } from "./create-brewing-recipe";
import { createSeededRandom } from "./random";
import { BrewingRecipeSchema } from "./schemas";

describe("createBrewingRecipe", () => {
  const fixtures = loadFixtures();
  const sake = fixtures.sakes[0]!;
  const snowLand = fixtures.landMemories[0]!;
  const seaLand = fixtures.landMemories[1]!;
  const input = fixtures.participantInputs[0]!;
  const seaInput = fixtures.participantInputs[1]!;
  const baseArguments = {
    sake,
    landMemory: snowLand,
    participantInput: input,
    clock: createFixedClock("2026-07-18T00:00:00.000Z"),
  };

  it("returns identical JSON for identical input, seed, and clock", () => {
    const first = createBrewingRecipe({ ...baseArguments, seed: "same-seed" });
    const second = createBrewingRecipe({ ...baseArguments, seed: "same-seed" });

    expect(second).toEqual(first);
    expect(
      BrewingRecipeSchema.parse(JSON.parse(JSON.stringify(first))),
    ).toEqual(first);
  });

  it("uses participant input in the recipe ID identity", () => {
    const changedParticipantInput = {
      ...input,
      initial: { ...input.initial, colorToken: "ink" as const },
    };
    const first = createBrewingRecipe({ ...baseArguments, seed: "identity" });
    const second = createBrewingRecipe({
      ...baseArguments,
      participantInput: changedParticipantInput,
      seed: "identity",
    });

    expect(second.recipeId).not.toBe(first.recipeId);
  });

  it("canonicalizes participant identity without relying on property order", () => {
    const reorderedParticipantInput = {
      tome: { ...input.tome },
      naka: { ...input.naka },
      initial: {
        gesture: { ...input.initial.gesture },
        colorToken: input.initial.colorToken,
      },
    };
    const first = createBrewingRecipe({ ...baseArguments, seed: "canonical" });
    const second = createBrewingRecipe({
      ...baseArguments,
      participantInput: reorderedParticipantInput,
      seed: "canonical",
    });

    expect(second.recipeId).toBe(first.recipeId);
  });

  it("reads the clock once and reuses the instant for identity and recipe data", () => {
    const clock = { now: vi.fn(() => "2026-07-18T00:00:00.000Z") };
    const recipe = createBrewingRecipe({
      ...baseArguments,
      seed: "single-clock-read",
      clock,
    });

    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(recipe.createdAt).toBe("2026-07-18T00:00:00.000Z");
  });

  it("changes generated parameters when the seed changes", () => {
    const first = createBrewingRecipe({ ...baseArguments, seed: "seed-one" });
    const second = createBrewingRecipe({ ...baseArguments, seed: "seed-two" });

    expect(second.recipeId).not.toBe(first.recipeId);
    expect(second.audio.notePattern).not.toEqual(first.audio.notePattern);
  });

  it("uses land traits to change the ambient and visual rule areas", () => {
    const snowRecipe = createBrewingRecipe({
      ...baseArguments,
      seed: "land-test",
    });
    const seaRecipe = createBrewingRecipe({
      ...baseArguments,
      landMemory: seaLand,
      participantInput: seaInput,
      seed: "land-test",
    });

    expect(seaRecipe.audio.ambientTexture).toBe("sea");
    expect(seaRecipe.visual.shapeFamily).toBe("wave");
    expect(seaRecipe.visual.waveAmplitude).not.toBe(
      snowRecipe.visual.waveAmplitude,
    );
  });

  it("does not mutate participant input and stays inside defined ranges", () => {
    const inputBefore = JSON.stringify(input);
    const recipe = createBrewingRecipe({
      ...baseArguments,
      seed: "range-test",
    });

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(recipe.audio.tempo).toBeGreaterThanOrEqual(40);
    expect(recipe.audio.tempo).toBeLessThanOrEqual(180);
    expect(recipe.visual.particleCount).toBeGreaterThanOrEqual(10);
    expect(recipe.visual.particleCount).toBeLessThanOrEqual(300);
  });

  it("records the actual Mulberry32 generator version", () => {
    const recipe = createBrewingRecipe({
      ...baseArguments,
      seed: "fixed-random",
    });
    expect(recipe.generatorVersion).toBe("mulberry32-v1");
  });
});

describe("seeded random", () => {
  it("returns the same sequence for the same seed without Math.random", () => {
    const first = createSeededRandom("known-seed");
    const second = createSeededRandom("known-seed");
    const firstSequence = [first.next(), first.next(), first.next()];
    const secondSequence = [second.next(), second.next(), second.next()];

    expect(firstSequence).toEqual(secondSequence);
    expect(firstSequence).toEqual([
      0.8203108904417604, 0.8592282170429826, 0.3366279834881425,
    ]);
  });
});

describe("clock test support", () => {
  it("always returns the injected fixed UTC instant", () => {
    const clock = createFixedClock("2026-07-18T12:34:56.000Z");
    expect(clock.now()).toBe("2026-07-18T12:34:56.000Z");
    expect(clock.now()).toBe("2026-07-18T12:34:56.000Z");
  });
});

describe("fixed random test support", () => {
  it("returns its injected test sequence without changing recipe generator metadata", () => {
    const random = createFixedSeededRandom([0.1, 0.2, 0.3]);
    expect([
      random.nextInt(0, 11),
      random.nextInt(0, 11),
      random.nextInt(0, 11),
    ]).toEqual([1, 2, 3]);
  });
});
