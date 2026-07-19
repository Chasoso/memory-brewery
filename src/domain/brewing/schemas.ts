import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);
const boundedUnit = z.number().finite().min(0).max(1);
const noControlCharacters = (value: string) =>
  [...value].every((character) => {
    const codePoint = character.charCodeAt(0);
    return codePoint >= 32 && codePoint !== 127;
  });

export const SourceMetadataSchema = z.object({
  kind: z.enum(["synthetic", "primary"]),
  provider: nonEmptyText,
  sourceUrl: z.url().nullable(),
  confirmedAt: z.iso.date(),
  license: nonEmptyText,
  sourceExcerptIncluded: z.boolean(),
  redistribution: z.enum(["allowed", "unknown", "prohibited"]),
  notes: z.string().max(240),
});

export const SakeProfileSchema = z.object({
  id: nonEmptyText,
  isSynthetic: z.boolean(),
  breweryName: nonEmptyText,
  productName: nonEmptyText,
  region: nonEmptyText,
  category: z.enum(["junmai", "ginjo", "other"]),
  riceVariety: nonEmptyText.nullable(),
  polishingRatio: z.number().finite().min(0).max(100).nullable(),
  alcoholPercentage: z.number().finite().min(0).max(100).nullable(),
  featureSummary: z.string().trim().min(1).max(240),
  normalizedTraits: z.object({
    brightness: boundedUnit,
    warmth: boundedUnit,
    body: boundedUnit,
    motion: boundedUnit,
  }),
  recommendedLandMemoryIds: z.array(nonEmptyText).min(2).max(3),
  source: SourceMetadataSchema,
});

export const LandTagSchema = z.enum([
  "water",
  "snow",
  "sea",
  "mountain",
  "town",
  "culture",
]);

export const LandMemorySchema = z.object({
  id: nonEmptyText,
  isSynthetic: z.boolean(),
  displayName: nonEmptyText,
  region: nonEmptyText,
  generativeDescription: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .refine(noControlCharacters),
  tags: z.array(LandTagSchema).min(1).max(6),
  season: z.enum(["spring", "summer", "autumn", "winter", "all-season"]),
  generativeTraits: z.object({
    water: boundedUnit,
    snow: boundedUnit,
    sea: boundedUnit,
    mountain: boundedUnit,
    town: boundedUnit,
    culture: boundedUnit,
  }),
  sourceFacts: z.array(z.string().trim().min(1).max(160)).max(4),
  source: SourceMetadataSchema,
});

export const GestureSummarySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("summary"),
    pointCount: z.number().int().min(1).max(10000),
    averageSpeed: z.number().finite().min(0).max(100000),
    travelDistance: z.number().finite().min(0).max(1000000),
    directionChanges: z.number().int().min(0).max(10000),
    intensity: boundedUnit,
    density: boundedUnit,
  }),
]);

export const InitialInputSchema = z.object({
  colorToken: z.enum([
    "ink",
    "rice",
    "water",
    "koji",
    "ferment",
    "earth",
    "night",
  ]),
  gesture: GestureSummarySchema,
});

export const NakaInputSchema = z.object({ landMemoryId: nonEmptyText });

export const FutureScenarioSchema = z.enum([
  "celebration",
  "quiet-evening",
  "reunion",
  "seasonal-visit",
]);

export const TomeInputSchema = z
  .object({
    scenario: FutureScenarioSchema.optional(),
    freeText: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine(noControlCharacters)
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.scenario === undefined && value.freeText === undefined) {
      context.addIssue({
        code: "custom",
        message: "Select a scenario or provide a future occasion.",
      });
    }
  });

export const ParticipantInputSchema = z.object({
  initial: InitialInputSchema,
  naka: NakaInputSchema,
  tome: TomeInputSchema,
});

export const AudioRecipeSchema = z.object({
  tempo: z.number().finite().min(40).max(180),
  scale: z.enum(["minor-pentatonic", "major-pentatonic", "dorian"]),
  register: z.enum(["low", "middle", "high"]),
  density: boundedUnit,
  durationSeconds: z.number().finite().min(5).max(60),
  notePattern: z.array(z.number().int().min(0).max(11)).min(4).max(8),
  timbreCategory: z.enum(["glass", "soft-pad", "water"]),
  dynamics: boundedUnit,
  ambientTexture: z.enum([
    "water",
    "snow",
    "sea",
    "mountain",
    "town",
    "culture",
  ]),
  muteAllowed: z.literal(true),
});

export const VisualRecipeSchema = z.object({
  paletteToken: z.enum([
    "ink",
    "rice",
    "water",
    "koji",
    "ferment",
    "earth",
    "night",
  ]),
  particleCount: z.number().int().min(10).max(300),
  particleSpeed: boundedUnit,
  flowDirectionDegrees: z.number().finite().min(0).max(359),
  turbulence: boundedUnit,
  waveAmplitude: boundedUnit,
  density: boundedUnit,
  fade: boundedUnit,
  durationSeconds: z.number().finite().min(5).max(60),
  motionCharacter: z.enum(["slow-ripple", "drift", "converge", "float"]),
  shapeFamily: z.enum(["particle", "wave", "ripple"]),
});

export const BrewingRecipeSchema = z.object({
  recipeId: z.string().regex(/^recipe-v1-[a-f0-9]{8}$/),
  schemaVersion: z.literal("1.0"),
  generatorVersion: z.literal("mulberry32-v1"),
  seed: nonEmptyText,
  createdAt: z.iso.datetime({ offset: true }),
  sakeId: nonEmptyText,
  landMemoryId: nonEmptyText,
  participantInput: ParticipantInputSchema,
  audio: AudioRecipeSchema,
  visual: VisualRecipeSchema,
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(180),
  metadata: z.object({
    sakeFixtureSynthetic: z.boolean(),
    landFixtureSynthetic: z.boolean(),
  }),
});

export const FixtureSetSchema = z.object({
  sakes: z.array(SakeProfileSchema).min(1),
  landMemories: z.array(LandMemorySchema).min(1),
  participantInputs: z.array(ParticipantInputSchema).min(1),
});

export type SourceMetadata = z.infer<typeof SourceMetadataSchema>;
export type SakeProfile = z.infer<typeof SakeProfileSchema>;
export type LandMemory = z.infer<typeof LandMemorySchema>;
export type GestureSummary = z.infer<typeof GestureSummarySchema>;
export type ParticipantInput = z.infer<typeof ParticipantInputSchema>;
export type AudioRecipe = z.infer<typeof AudioRecipeSchema>;
export type VisualRecipe = z.infer<typeof VisualRecipeSchema>;
export type BrewingRecipe = z.infer<typeof BrewingRecipeSchema>;
export type FixtureSet = z.infer<typeof FixtureSetSchema>;
