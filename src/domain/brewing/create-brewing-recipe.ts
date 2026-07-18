import {
  BrewingRecipeSchema,
  type BrewingRecipe,
  type LandMemory,
  type ParticipantInput,
  type SakeProfile,
} from "./schemas";
import type { Clock } from "./clock";
import { createSeededRandom } from "./random";

export type CreateBrewingRecipeInput = {
  sake: SakeProfile;
  landMemory: LandMemory;
  participantInput: ParticipantInput;
  seed: string | number;
  clock: Clock;
};

export function createBrewingRecipe(
  input: CreateBrewingRecipeInput,
): BrewingRecipe {
  if (input.participantInput.naka.landMemoryId !== input.landMemory.id) {
    throw new Error(
      `Land memory ID is not available: ${input.participantInput.naka.landMemoryId}`,
    );
  }

  const seed = String(input.seed);
  const createdAt = input.clock.now();
  const random = createSeededRandom(seed);
  const gesture = input.participantInput.initial.gesture;
  const gestureIntensity =
    gesture.kind === "summary" ? gesture.intensity : 0.25;
  const gestureDensity = gesture.kind === "summary" ? gesture.density : 0.25;
  const land = input.landMemory.generativeTraits;
  const sake = input.sake.normalizedTraits;
  const scenario = input.participantInput.tome.scenario ?? "quiet-evening";

  // Sake establishes a base; initial gesture changes motion; land supplies ambience and flow.
  const tempo = clamp(
    Math.round(
      62 + sake.brightness * 24 + gestureIntensity * 18 + random.nextInt(-4, 4),
    ),
    40,
    180,
  );
  const density = clamp((sake.body + gestureDensity + land.water) / 3, 0, 1);
  const durationSeconds =
    scenario === "celebration" ? 30 : scenario === "quiet-evening" ? 42 : 36;
  const ambientTexture = dominantLandTag(land);

  const recipe = {
    recipeId: `recipe-v1-${fnv1a(
      canonicalizeRecipeIdentity({
        seed,
        sakeId: input.sake.id,
        landMemoryId: input.landMemory.id,
        createdAt,
        participantInput: input.participantInput,
      }),
    )}`,
    schemaVersion: "1.0" as const,
    generatorVersion: "mulberry32-v1" as const,
    seed,
    createdAt,
    sakeId: input.sake.id,
    landMemoryId: input.landMemory.id,
    participantInput: input.participantInput,
    audio: {
      tempo,
      scale:
        scenario === "celebration"
          ? "major-pentatonic"
          : sake.warmth > 0.55
            ? "dorian"
            : "minor-pentatonic",
      register:
        sake.body > 0.65 ? "low" : gestureIntensity > 0.65 ? "high" : "middle",
      density,
      durationSeconds,
      notePattern: Array.from({ length: 6 }, () => random.nextInt(0, 11)),
      timbreCategory:
        sake.brightness > 0.6
          ? "glass"
          : land.water > 0.6
            ? "water"
            : "soft-pad",
      dynamics: clamp((gestureIntensity + sake.motion) / 2, 0, 1),
      ambientTexture,
      muteAllowed: true as const,
    },
    visual: {
      paletteToken: input.participantInput.initial.colorToken,
      particleCount: clampInteger(
        Math.round(50 + density * 180 + random.nextInt(-10, 10)),
        10,
        300,
      ),
      particleSpeed: clamp((sake.motion + gestureIntensity) / 2, 0, 1),
      flowDirectionDegrees: clampInteger(
        Math.round(land.sea * 90 + land.mountain * 180 + random.nextInt(0, 89)),
        0,
        359,
      ),
      turbulence: clamp((gestureIntensity + land.snow) / 2, 0, 1),
      waveAmplitude: clamp((land.water + land.sea) / 2, 0, 1),
      density,
      fade: clamp(1 - density * 0.45, 0, 1),
      durationSeconds,
      motionCharacter:
        scenario === "celebration"
          ? "converge"
          : gestureIntensity > 0.65
            ? "drift"
            : "slow-ripple",
      shapeFamily:
        land.water + land.sea > 0.8
          ? "wave"
          : gestureDensity > 0.55
            ? "particle"
            : "ripple",
    },
    title: `${input.landMemory.displayName}の${scenarioLabel(scenario)}`,
    description: `${input.sake.productName}を基調に、${input.landMemory.generativeDescription}を重ねた開発用レシピ。`,
    metadata: {
      sakeFixtureSynthetic: input.sake.isSynthetic,
      landFixtureSynthetic: input.landMemory.isSynthetic,
    },
  };

  return BrewingRecipeSchema.parse(recipe);
}

function canonicalizeRecipeIdentity(input: {
  seed: string;
  sakeId: string;
  landMemoryId: string;
  createdAt: string;
  participantInput: ParticipantInput;
}): string {
  const { initial, naka, tome } = input.participantInput;
  const fields: [string, string | number | null][] = [
    ["seed", input.seed],
    ["sakeId", input.sakeId],
    ["landMemoryId", input.landMemoryId],
    ["createdAt", input.createdAt],
    ["initial.colorToken", initial.colorToken],
    ["gesture.kind", initial.gesture.kind],
    ["naka.landMemoryId", naka.landMemoryId],
    ["tome.scenario", tome.scenario ?? null],
    ["tome.freeText", tome.freeText ?? null],
  ];

  if (initial.gesture.kind === "summary") {
    fields.push(
      ["gesture.pointCount", initial.gesture.pointCount],
      ["gesture.averageSpeed", initial.gesture.averageSpeed],
      ["gesture.travelDistance", initial.gesture.travelDistance],
      ["gesture.directionChanges", initial.gesture.directionChanges],
      ["gesture.intensity", initial.gesture.intensity],
      ["gesture.density", initial.gesture.density],
    );
  }

  return fields
    .map(([name, value]) => `${name}=${canonicalValue(value)}`)
    .join("|");
}

function canonicalValue(value: string | number | null): string {
  const serialized = value === null ? "null" : String(value);
  return `${serialized.length}:${serialized}`;
}

function dominantLandTag(
  traits: LandMemory["generativeTraits"],
): "water" | "snow" | "sea" | "mountain" | "town" | "culture" {
  return (
    Object.entries(traits) as [
      "water" | "snow" | "sea" | "mountain" | "town" | "culture",
      number,
    ][]
  ).reduce((current, candidate) =>
    candidate[1] > current[1] ? candidate : current,
  )[0];
}

function scenarioLabel(
  scenario: "celebration" | "quiet-evening" | "reunion" | "seasonal-visit",
): string {
  return {
    celebration: "祝い",
    "quiet-evening": "静かな夜",
    reunion: "再会",
    "seasonal-visit": "季節の訪れ",
  }[scenario];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.round(clamp(value, minimum, maximum));
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
