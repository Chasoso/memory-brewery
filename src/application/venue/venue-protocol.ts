import { z } from "zod";

import {
  BrewingRecipeSchema,
  type BrewingRecipe,
} from "../../domain/brewing/schemas";

export const venueProtocolVersion = 1;
export const venueSnapshotVersion = 1;

const messageBase = z.object({
  protocolVersion: z.literal(venueProtocolVersion),
  messageId: z.string().trim().min(1).max(160),
  sentAt: z.iso.datetime({ offset: true }),
});

export const VenueMessageSchema = z.discriminatedUnion("type", [
  messageBase.extend({
    type: z.literal("recipe-published"),
    recipe: BrewingRecipeSchema,
  }),
  messageBase.extend({ type: z.literal("collection-cleared") }),
]);

export const VenueSnapshotSchema = z.object({
  snapshotVersion: z.literal(venueSnapshotVersion),
  updatedAt: z.iso.datetime({ offset: true }),
  recipes: z.array(BrewingRecipeSchema),
});

export type VenueMessage = z.infer<typeof VenueMessageSchema>;
export type VenueSnapshot = z.infer<typeof VenueSnapshotSchema>;

export type PublishResult =
  | { status: "published"; recipeId: string }
  | { status: "duplicate"; recipeId: string }
  | { status: "conflict"; recipeId: string }
  | {
      status: "failed";
      reason: "invalid" | "storage-unavailable" | "storage-error";
    };

export interface RecipePublisher {
  publish(recipe: BrewingRecipe): Promise<PublishResult>;
  dispose(): void;
}
