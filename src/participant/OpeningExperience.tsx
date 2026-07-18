import { useEffect, useRef, useState } from "react";

import type { AnimationDriver } from "../application/opening/animation-driver";
import type {
  AudioPlayer,
  AudioPlaybackStatus,
} from "../application/opening/audio-player";
import { NoOpAudioPlayer } from "../adapters/opening/no-op-audio-player";
import { ToneAudioPlayer } from "../adapters/opening/tone-audio-player";
import type { BrewingRecipe } from "../domain/brewing/schemas";
import { OpeningCanvas } from "./OpeningCanvas";

const defaultOpeningDurationMs = 20_000;

type OpeningStatus = "ready" | "starting" | "playing" | "completed";

export function OpeningExperience({
  recipe,
  onReset,
  animationDriver,
  openingDurationMs = defaultOpeningDurationMs,
  audioPlayerFactory = () => new ToneAudioPlayer(),
}: {
  recipe: BrewingRecipe;
  onReset: () => void;
  animationDriver?: AnimationDriver;
  openingDurationMs?: number;
  audioPlayerFactory?: () => AudioPlayer;
}) {
  const [status, setStatus] = useState<OpeningStatus>("ready");
  const [audioWanted, setAudioWanted] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioPlaybackStatus>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioPlayer = useRef<AudioPlayer | undefined>(undefined);
  const completionTimer = useRef<number | undefined>(undefined);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(
    () => () => {
      if (completionTimer.current !== undefined)
        window.clearTimeout(completionTimer.current);
      audioPlayer.current?.dispose();
    },
    [],
  );

  const start = async () => {
    if (started.current) return;
    started.current = true;
    setStatus("starting");

    if (audioWanted) {
      const player = audioPlayerFactory();
      audioPlayer.current = player;
      const nextAudioStatus = await player.start(recipe.audio);
      setAudioStatus(nextAudioStatus);
    } else {
      const player = new NoOpAudioPlayer("muted");
      audioPlayer.current = player;
      setAudioStatus(await player.start(recipe.audio));
    }

    setStatus("playing");
    completionTimer.current = window.setTimeout(() => {
      setStatus("completed");
      audioPlayer.current?.stop();
      setAudioStatus((current) =>
        current === "playing" ? "stopped" : current,
      );
    }, openingDurationMs);
  };

  const replay = () => {
    if (completionTimer.current !== undefined)
      window.clearTimeout(completionTimer.current);
    audioPlayer.current?.stop();
    audioPlayer.current?.dispose();
    audioPlayer.current = undefined;
    started.current = false;
    setAudioStatus("idle");
    setStatus("ready");
  };

  const stopAudio = () => {
    audioPlayer.current?.stop();
    setAudioStatus("stopped");
  };

  const reset = () => {
    if (completionTimer.current !== undefined)
      window.clearTimeout(completionTimer.current);
    audioPlayer.current?.dispose();
    onReset();
  };

  return (
    <section className="opening-experience" aria-label="開栓体験">
      <div className="opening-artwork" data-opening-status={status}>
        <OpeningCanvas
          recipe={recipe}
          active={status === "playing"}
          reducedMotion={reducedMotion}
          {...(animationDriver === undefined ? {} : { animationDriver })}
        />
        <p className="opening-artwork-caption" aria-live="polite">
          {status === "ready" && "開栓すると、作品が静かに動き始めます。"}
          {status === "starting" && "作品を開いています。"}
          {status === "playing" && "作品を再生中です。"}
          {status === "completed" && "作品は静かな余韻として残っています。"}
        </p>
      </div>

      <fieldset className="audio-choice">
        <legend>音声</legend>
        <label>
          <input
            type="radio"
            name="opening-audio"
            checked={!audioWanted}
            disabled={status !== "ready"}
            onChange={() => setAudioWanted(false)}
          />
          音声なしで開栓する
        </label>
        <label>
          <input
            type="radio"
            name="opening-audio"
            checked={audioWanted}
            disabled={status !== "ready"}
            onChange={() => setAudioWanted(true)}
          />
          音声を使う
        </label>
      </fieldset>
      <p className="audio-status" aria-live="polite">
        {audioMessage(audioStatus)}
      </p>

      {status === "ready" && (
        <button
          className="primary-button opening-button"
          type="button"
          onClick={() => void start()}
        >
          開栓する <span aria-hidden="true">→</span>
        </button>
      )}
      {status === "playing" && audioStatus === "playing" && (
        <button
          className="text-button opening-control"
          type="button"
          onClick={stopAudio}
        >
          音声を停止する
        </button>
      )}
      {status === "completed" && (
        <button
          className="text-button opening-control"
          type="button"
          onClick={replay}
        >
          もう一度見る
        </button>
      )}
      <button
        className="back-button opening-reset"
        type="button"
        onClick={reset}
      >
        最初から仕込む
      </button>
    </section>
  );
}

function audioMessage(status: AudioPlaybackStatus): string {
  switch (status) {
    case "playing":
      return "音声を再生中です。";
    case "muted":
      return "音声なしで作品を表示しています。";
    case "unavailable":
      return "この環境では音声を利用できません。作品はそのまま楽しめます。";
    case "failed":
      return "音声を開始できませんでした。作品はそのまま楽しめます。";
    case "stopped":
      return "音声を停止しました。";
    case "idle":
      return "音声は開栓操作のあとにのみ開始します。";
  }
}
