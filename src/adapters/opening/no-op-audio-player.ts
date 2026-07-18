import type {
  AudioPlayer,
  AudioPlaybackStatus,
} from "../../application/opening/audio-player";
import type { AudioRecipe } from "../../domain/brewing/schemas";

/** Explicit silent adapter for declined, unsupported, and automated environments. */
export class NoOpAudioPlayer implements AudioPlayer {
  constructor(private readonly result: AudioPlaybackStatus = "unavailable") {}

  start(recipe: AudioRecipe): Promise<AudioPlaybackStatus> {
    void recipe;
    return Promise.resolve(this.result);
  }

  stop(): void {}

  setMuted(muted: boolean): void {
    void muted;
  }

  dispose(): void {}
}
