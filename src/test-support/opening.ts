import type {
  AnimationDriver,
  AnimationFrameCallback,
} from "../application/opening/animation-driver";
import type {
  AudioPlayer,
  AudioPlaybackStatus,
} from "../application/opening/audio-player";
import type { AudioRecipe } from "../domain/brewing/schemas";

export class ManualAnimationDriver implements AnimationDriver {
  private nextId = 1;
  private readonly callbacks = new Map<number, AnimationFrameCallback>();

  constructor(private currentTimeMs = 0) {}

  now(): number {
    return this.currentTimeMs;
  }

  requestFrame(callback: AnimationFrameCallback): number {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    return id;
  }

  cancelFrame(requestId: number): void {
    this.callbacks.delete(requestId);
  }

  advanceTo(timeMs: number): void {
    this.currentTimeMs = timeMs;
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback(timeMs));
  }

  get pendingFrames(): number {
    return this.callbacks.size;
  }
}

export class FakeAudioPlayer implements AudioPlayer {
  starts = 0;
  stops = 0;
  disposals = 0;
  muted = false;

  constructor(private readonly result: AudioPlaybackStatus = "playing") {}

  start(recipe: AudioRecipe): Promise<AudioPlaybackStatus> {
    void recipe;
    this.starts += 1;
    return Promise.resolve(this.result);
  }

  stop(): void {
    this.stops += 1;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  dispose(): void {
    this.disposals += 1;
  }
}
