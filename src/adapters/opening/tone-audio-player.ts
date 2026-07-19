import type {
  AudioPlayer,
  AudioPlaybackStatus,
} from "../../application/opening/audio-player";
import type { AudioRecipe } from "../../domain/brewing/schemas";

const maximumNotes = 8;
const maximumScheduledNotes = 24;

/** Browser-only Tone adapter. Tone is dynamically imported only after opening. */
export class ToneAudioPlayer implements AudioPlayer {
  private disposed = false;
  private started = false;
  private muted = false;
  private stopTimer: number | undefined;
  private tone: typeof import("tone") | undefined;
  private synth: import("tone").Synth | undefined;

  async start(recipe: AudioRecipe): Promise<AudioPlaybackStatus> {
    if (this.disposed) return "stopped";
    if (this.started) return this.muted ? "muted" : "playing";

    try {
      this.tone = await import("tone");
      await this.tone.start();
      if (this.disposed) return "stopped";
      this.synth = new this.tone.Synth(synthOptions(recipe)).toDestination();
      this.synth.volume.value = -22;
      scheduleRecipe(this.tone, this.synth, recipe);
      this.stopTimer = window.setTimeout(
        () => this.stop(),
        recipe.durationSeconds * 1000,
      );
      this.started = true;
      return this.muted ? "muted" : "playing";
    } catch {
      this.disposeResources();
      return "failed";
    }
  }

  stop(): void {
    if (this.stopTimer !== undefined) window.clearTimeout(this.stopTimer);
    this.stopTimer = undefined;
    this.disposeResources();
    this.started = false;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.synth !== undefined)
      this.synth.volume.value = muted ? -Infinity : -22;
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
  }

  private disposeResources(): void {
    this.synth?.dispose();
    this.synth = undefined;
  }
}

export function mapAudioRecipe(recipe: AudioRecipe): {
  readonly noteNames: readonly string[];
  readonly intervalSeconds: number;
  readonly velocity: number;
} {
  const root =
    recipe.register === "low" ? 3 : recipe.register === "high" ? 5 : 4;
  const scale = scaleOffsets(recipe.scale);
  const noteNames = recipe.notePattern.slice(0, maximumNotes).map((step) => {
    const offset = scale[step % scale.length] ?? 0;
    return midiToNote(
      root * 12 + offset + Math.floor(step / scale.length) * 12,
    );
  });
  return {
    noteNames,
    intervalSeconds: Math.max(
      0.28,
      (60 / recipe.tempo) * (1.45 - recipe.density * 0.7),
    ),
    velocity: Math.min(0.38, Math.max(0.08, 0.1 + recipe.dynamics * 0.28)),
  };
}

function scheduleRecipe(
  tone: typeof import("tone"),
  synth: import("tone").Synth,
  recipe: AudioRecipe,
): void {
  const mapped = mapAudioRecipe(recipe);
  const start = tone.now() + 0.05;
  const noteCount = Math.min(
    maximumScheduledNotes,
    Math.max(
      mapped.noteNames.length,
      Math.floor((recipe.durationSeconds - 0.6) / mapped.intervalSeconds),
    ),
  );
  for (let index = 0; index < noteCount; index += 1) {
    const note = mapped.noteNames[index % mapped.noteNames.length];
    if (note === undefined) continue;
    synth.triggerAttackRelease(
      note,
      "8n",
      start + index * mapped.intervalSeconds,
      mapped.velocity,
    );
  }
}

function synthOptions(
  recipe: AudioRecipe,
): ConstructorParameters<typeof import("tone").Synth>[0] {
  const oscillatorType =
    recipe.timbreCategory === "glass"
      ? "sine"
      : recipe.timbreCategory === "water"
        ? "triangle"
        : "sine";
  const release = recipe.ambientTexture === "snow" ? 1.8 : 1.2;
  return {
    oscillator: { type: oscillatorType },
    envelope: {
      attack: 0.06,
      decay: 0.22,
      sustain: 0.22 + recipe.density * 0.2,
      release,
    },
  };
}

function scaleOffsets(scale: AudioRecipe["scale"]): readonly number[] {
  switch (scale) {
    case "major-pentatonic":
      return [0, 2, 4, 7, 9];
    case "dorian":
      return [0, 2, 3, 5, 7, 9, 10];
    case "minor-pentatonic":
      return [0, 3, 5, 7, 10];
  }
}

function midiToNote(midi: number): string {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const name = names[midi % 12] ?? "C";
  return `${name}${Math.floor(midi / 12) - 1}`;
}
