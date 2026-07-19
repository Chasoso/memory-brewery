import {
  BrewingRecipeSchema,
  type BrewingRecipe,
} from "../../domain/brewing/schemas";
import {
  createSnapshot,
  mergeVenueRecipe,
  normalizeVenueRecipes,
} from "../../application/venue/venue-collection";
import {
  type PublishResult,
  type RecipePublisher,
  VenueMessageSchema,
  VenueSnapshotSchema,
  type VenueMessage,
} from "../../application/venue/venue-protocol";

export const venueBroadcastChannelName = "memory-brewery-local-venue-v1";
export const venueSnapshotStorageKey = "memory-brewery.local-venue.snapshot.v1";

export type VenueChange =
  | { type: "recipes"; recipes: BrewingRecipe[]; latestRecipeId?: string }
  | { type: "cleared"; recipes: BrewingRecipe[] };

/** Browser-only adapter. It never trusts channel messages or localStorage values. */
export class LocalVenueSync implements RecipePublisher {
  private readonly listeners = new Set<(change: VenueChange) => void>();
  private readonly channel: BroadcastChannel | undefined;
  private disposed = false;

  constructor(
    private readonly storageKey = venueSnapshotStorageKey,
    channelName = venueBroadcastChannelName,
  ) {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event: MessageEvent<unknown>) =>
        this.receiveMessage(event.data);
    }
    if (typeof window !== "undefined")
      window.addEventListener("storage", this.onStorage);
  }

  load(): BrewingRecipe[] {
    return this.readSnapshot();
  }

  subscribe(listener: (change: VenueChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(recipe: BrewingRecipe): Promise<PublishResult> {
    if (this.disposed || !BrewingRecipeSchema.safeParse(recipe).success)
      return Promise.resolve({ status: "failed", reason: "invalid" });
    const current = this.readSnapshot();
    const merged = mergeVenueRecipe(current, recipe);
    if (merged.status === "duplicate")
      return Promise.resolve({
        status: "duplicate",
        recipeId: recipe.recipeId,
      });
    if (merged.status === "conflict")
      return Promise.resolve({ status: "conflict", recipeId: recipe.recipeId });
    const stored = this.writeSnapshot(merged.recipes);
    this.emit({
      type: "recipes",
      recipes: merged.recipes,
      latestRecipeId: recipe.recipeId,
    });
    this.post({ type: "recipe-published", recipe });
    return Promise.resolve(
      stored
        ? { status: "published", recipeId: recipe.recipeId }
        : { status: "failed", reason: "storage-error" },
    );
  }

  clear(): boolean {
    if (this.disposed) return false;
    const stored = this.writeSnapshot([]);
    this.emit({ type: "cleared", recipes: [] });
    this.post({ type: "collection-cleared" });
    return stored;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.channel?.close();
    if (typeof window !== "undefined")
      window.removeEventListener("storage", this.onStorage);
    this.listeners.clear();
  }

  private onStorage = (event: StorageEvent) => {
    if (event.key === this.storageKey && !this.disposed)
      this.emit({ type: "recipes", recipes: this.readSnapshot() });
  };

  private receiveMessage(value: unknown): void {
    if (this.disposed) return;
    const parsed = VenueMessageSchema.safeParse(value);
    if (!parsed.success) return;
    const message = parsed.data;
    if (message.type === "collection-cleared") {
      this.writeSnapshot([]);
      this.emit({ type: "cleared", recipes: [] });
      return;
    }
    const current = this.readSnapshot();
    const merged = mergeVenueRecipe(current, message.recipe);
    if (merged.status === "duplicate") {
      // A storage event can arrive before its matching broadcast. Keep the
      // collection idempotent while still surfacing the transient arrival.
      this.emit({
        type: "recipes",
        recipes: current,
        latestRecipeId: message.recipe.recipeId,
      });
      return;
    }
    if (merged.status !== "added") return;
    this.writeSnapshot(merged.recipes);
    this.emit({
      type: "recipes",
      recipes: merged.recipes,
      latestRecipeId: message.recipe.recipeId,
    });
  }

  private readSnapshot(): BrewingRecipe[] {
    try {
      if (typeof localStorage === "undefined") return [];
      const value = localStorage.getItem(this.storageKey);
      if (value === null) return [];
      const parsed = VenueSnapshotSchema.safeParse(JSON.parse(value));
      return parsed.success ? normalizeVenueRecipes(parsed.data.recipes) : [];
    } catch {
      return [];
    }
  }

  private writeSnapshot(recipes: readonly BrewingRecipe[]): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(createSnapshot(recipes, new Date().toISOString())),
      );
      return true;
    } catch {
      return false;
    }
  }

  private post(message: {
    type: VenueMessage["type"];
    recipe?: BrewingRecipe;
  }): void {
    try {
      const envelope =
        message.type === "recipe-published"
          ? {
              protocolVersion: 1 as const,
              type: message.type,
              messageId: `recipe:${message.recipe?.recipeId ?? "invalid"}`,
              sentAt: new Date().toISOString(),
              recipe: message.recipe,
            }
          : {
              protocolVersion: 1 as const,
              type: message.type,
              messageId: `clear:${Date.now()}`,
              sentAt: new Date().toISOString(),
            };
      const parsed = VenueMessageSchema.safeParse(envelope);
      if (parsed.success) this.channel?.postMessage(parsed.data);
    } catch {
      /* Snapshot remains the late-open fallback. */
    }
  }

  private emit(change: VenueChange): void {
    this.listeners.forEach((listener) => listener(change));
  }
}
