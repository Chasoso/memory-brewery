import { createSeededRandom } from "../../domain/brewing/random";
import type { BrewingRecipe } from "../../domain/brewing/schemas";
import { compareRecipes } from "./venue-collection";

export const venueRendererVersion = "venue-canvas-2d-v1";

export type VenueAggregate = {
  count: number;
  landCounts: Record<string, number>;
  paletteCounts: Record<string, number>;
  marks: readonly {
    id: string;
    x: number;
    y: number;
    radius: number;
    phase: number;
    palette: string;
  }[];
};

export function createVenueAggregate(
  recipes: readonly BrewingRecipe[],
): VenueAggregate {
  const ordered = [...recipes].sort(compareRecipes);
  const landCounts: Record<string, number> = {};
  const paletteCounts: Record<string, number> = {};
  const marks = ordered.slice(-50).map((recipe) => {
    landCounts[recipe.landMemoryId] =
      (landCounts[recipe.landMemoryId] ?? 0) + 1;
    paletteCounts[recipe.visual.paletteToken] =
      (paletteCounts[recipe.visual.paletteToken] ?? 0) + 1;
    const random = createSeededRandom(
      `${recipe.seed}|${recipe.recipeId}|${venueRendererVersion}`,
    );
    return {
      id: recipe.recipeId,
      x: random.next(),
      y: random.next(),
      radius: 1 + random.next() * 3,
      phase: random.next() * Math.PI * 2,
      palette: recipe.visual.paletteToken,
    };
  });
  return { count: ordered.length, landCounts, paletteCounts, marks };
}

export function venueDrawing(
  aggregate: VenueAggregate,
  width: number,
  height: number,
  timeMs: number,
  reducedMotion: boolean,
) {
  const motion = reducedMotion ? 0.1 : 1;
  const seconds = Math.max(0, timeMs) / 1000;
  return aggregate.marks.map((mark) => ({
    ...mark,
    x:
      width *
      (0.5 +
        (mark.x - 0.5) * 0.7 +
        Math.sin(seconds * 0.25 + mark.phase) * 0.04 * motion),
    y:
      height *
      (0.5 +
        (mark.y - 0.5) * 0.65 +
        Math.cos(seconds * 0.2 + mark.phase) * 0.035 * motion),
  }));
}
