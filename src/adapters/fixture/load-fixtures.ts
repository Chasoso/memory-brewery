import landMemoryFixtures from "./land-memory-fixtures.json";
import participantInputFixtures from "./participant-input-fixtures.json";
import sakeFixtures from "./sake-fixtures.json";
import {
  FixtureSetSchema,
  SakeIdSchema,
  type FixtureSet,
} from "../../domain/brewing/schemas";

export const DEFAULT_SAKE_ID = SakeIdSchema.parse("development-sake-snow-01");

export function loadFixtures(): FixtureSet {
  return parseFixtureSet({
    sakes: sakeFixtures,
    landMemories: landMemoryFixtures,
    participantInputs: participantInputFixtures,
  });
}

export function parseFixtureSet(rawFixtureSet: unknown): FixtureSet {
  const result = FixtureSetSchema.safeParse(rawFixtureSet);
  if (!result.success) {
    throw new Error(
      `Fixture validation failed: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  }

  assertUniqueIds(result.data.sakes, "sake");
  assertUniqueIds(result.data.landMemories, "land memory");
  const landMemoryIds = new Set(
    result.data.landMemories.map((landMemory) => landMemory.id),
  );
  if (!result.data.sakes.some((sake) => sake.id === DEFAULT_SAKE_ID)) {
    throw new Error(
      `Fixture validation failed: default sake ID not found: ${DEFAULT_SAKE_ID}`,
    );
  }
  for (const sake of result.data.sakes) {
    for (const landMemoryId of sake.recommendedLandMemoryIds) {
      if (!landMemoryIds.has(landMemoryId)) {
        throw new Error(
          `Fixture validation failed: sake ${sake.id} references missing land memory ID: ${landMemoryId}`,
        );
      }
    }
  }
  for (const participantInput of result.data.participantInputs) {
    if (!landMemoryIds.has(participantInput.naka.landMemoryId)) {
      throw new Error(
        `Fixture validation failed: land memory ID not found: ${participantInput.naka.landMemoryId}`,
      );
    }
  }

  return result.data;
}

function assertUniqueIds(items: { id: string }[], fixtureName: string): void {
  const seenIds = new Set<string>();
  for (const item of items) {
    if (seenIds.has(item.id))
      throw new Error(
        `Fixture validation failed: duplicate ${fixtureName} ID: ${item.id}`,
      );
    seenIds.add(item.id);
  }
}
