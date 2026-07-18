import type { AudioRecipe } from "../../domain/brewing/schemas";

export type AudioPlaybackStatus =
  "idle" | "playing" | "muted" | "unavailable" | "failed" | "stopped";

export interface AudioPlayer {
  start(recipe: AudioRecipe): Promise<AudioPlaybackStatus>;
  stop(): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}
