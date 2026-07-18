import type { Clock } from "../domain/brewing/clock";
import type { SeededRandom } from "../domain/brewing/random";
import type { ParticipantInput } from "../domain/brewing/schemas";

export function createFixedClock(
  isoDateTime = "2026-07-18T00:00:00.000Z",
): Clock {
  return { now: () => isoDateTime };
}

export function createFixedSeededRandom(values: number[]): SeededRandom {
  let index = 0;
  return {
    next() {
      const value = values[index % values.length];
      index += 1;
      if (value === undefined || value < 0 || value >= 1)
        throw new Error("Fixed random values must be in [0, 1).");
      return value;
    },
    nextInt(minInclusive, maxInclusive) {
      return (
        minInclusive +
        Math.floor(this.next() * (maxInclusive - minInclusive + 1))
      );
    },
  };
}

export function createParticipantInput(
  overrides: Partial<ParticipantInput> = {},
): ParticipantInput {
  return {
    initial: {
      colorToken: "ferment",
      gesture: {
        kind: "summary",
        pointCount: 12,
        averageSpeed: 120,
        travelDistance: 600,
        directionChanges: 4,
        intensity: 0.5,
        density: 0.5,
      },
    },
    naka: { landMemoryId: "development-land-snow-01" },
    tome: { scenario: "quiet-evening" },
    ...overrides,
  };
}
