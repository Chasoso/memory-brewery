import type { BrewingRecipe } from "../../domain/brewing/schemas";
import type { VenueSnapshot } from "./venue-protocol";

export const maximumVenueRecipes = 50;

export type CollectionMerge =
  | { status: "added"; recipes: BrewingRecipe[] }
  | { status: "duplicate"; recipes: BrewingRecipe[] }
  | { status: "conflict"; recipes: BrewingRecipe[] };

/** A stable collection boundary: createdAt then recipeId, with oldest eviction. */
export function normalizeVenueRecipes(
  recipes: readonly BrewingRecipe[],
): BrewingRecipe[] {
  const byId = new Map<string, BrewingRecipe>();
  for (const recipe of recipes) {
    const existing = byId.get(recipe.recipeId);
    if (existing === undefined) byId.set(recipe.recipeId, recipe);
  }
  return [...byId.values()].sort(compareRecipes).slice(-maximumVenueRecipes);
}

export function mergeVenueRecipe(
  recipes: readonly BrewingRecipe[],
  incoming: BrewingRecipe,
): CollectionMerge {
  const normalized = normalizeVenueRecipes(recipes);
  const existing = normalized.find(
    (recipe) => recipe.recipeId === incoming.recipeId,
  );
  if (existing !== undefined) {
    return {
      status: sameRecipe(existing, incoming) ? "duplicate" : "conflict",
      recipes: normalized,
    };
  }
  return {
    status: "added",
    recipes: normalizeVenueRecipes([...normalized, incoming]),
  };
}

export function createSnapshot(
  recipes: readonly BrewingRecipe[],
  updatedAt: string,
): VenueSnapshot {
  return {
    snapshotVersion: 1,
    updatedAt,
    recipes: normalizeVenueRecipes(recipes),
  };
}

export function compareRecipes(
  left: BrewingRecipe,
  right: BrewingRecipe,
): number {
  return (
    left.createdAt.localeCompare(right.createdAt) ||
    left.recipeId.localeCompare(right.recipeId)
  );
}

function sameRecipe(left: BrewingRecipe, right: BrewingRecipe): boolean {
  // Schemas construct a fixed, JSON-safe object shape; this detects an ID collision without mutation.
  return JSON.stringify(left) === JSON.stringify(right);
}
