import { loadFixtures } from "../../adapters/fixture/load-fixtures";
import type { VenueAggregate } from "./venue-scene";

export type VenueLandSummary = { displayName: string; count: number };

/** Resolves presentation labels outside the venue React component. */
export function createVenueLandSummaries(
  aggregate: VenueAggregate,
): VenueLandSummary[] {
  let names = new Map<string, string>();
  try {
    names = new Map(
      loadFixtures().landMemories.map((land) => [land.id, land.displayName]),
    );
  } catch {
    // A damaged fixture must not prevent the venue from rendering saved recipes.
  }
  return Object.entries(aggregate.landCounts).map(([id, count]) => ({
    displayName: names.get(id) ?? "土地の記憶",
    count,
  }));
}
