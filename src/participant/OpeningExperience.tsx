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

type OpeningStatus = "ready" | "playing" | "completed";

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
  const [visualTimeMs, setVisualTimeMs] = useState(0);
  const [audioWanted, setAudioWanted] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioPlaybackStatus>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioPlayer = useRef<AudioPlayer | undefined>(undefined);
  const completionTimer = useRef<number | undefined>(undefined);
  const started = useRef(false);
  const mounted = useRef(true);
  const sessionId = useRef(0);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateAudioSession();
    };
  }, []);

  function invalidateAudioSession() {
    sessionId.current += 1;
    if (completionTimer.current !== undefined) {
      window.clearTimeout(completionTimer.current);
      completionTimer.current = undefined;
    }
    audioPlayer.current?.dispose();
    audioPlayer.current = undefined;
  }

  const start = () => {
    if (started.current) return;
    started.current = true;
    const currentSession = sessionId.current + 1;
    sessionId.current = currentSession;

    // Visual timing starts immediately and never waits for Web Audio.
    setVisualTimeMs(0);
    setStatus("playing");
    completionTimer.current = window.setTimeout(() => {
      setVisualTimeMs(openingDurationMs);
      setStatus("completed");
      audioPlayer.current?.stop();
      // A late Tone import/start must not revive audio after visual completion.
      sessionId.current += 1;
      audioPlayer.current = undefined;
      setAudioStatus((current) =>
        current === "playing" || current === "starting" ? "stopped" : current,
      );
    }, openingDurationMs);

    if (!audioWanted) {
      const player = new NoOpAudioPlayer("muted");
      audioPlayer.current = player;
      setAudioStatus("muted");
      return;
    }

    const player = audioPlayerFactory();
    audioPlayer.current = player;
    setAudioStatus("starting");
    void player.start(recipe.audio).then(
      (nextStatus) => {
        if (!mounted.current || sessionId.current !== currentSession) {
          player.dispose();
          return;
        }
        setAudioStatus(nextStatus);
      },
      () => {
        if (!mounted.current || sessionId.current !== currentSession) {
          player.dispose();
          return;
        }
        setAudioStatus("failed");
      },
    );
  };

  const replay = () => {
    invalidateAudioSession();
    started.current = false;
    setVisualTimeMs(0);
    setAudioStatus("idle");
    setStatus("ready");
  };

  const stopAudio = () => {
    audioPlayer.current?.stop();
    setAudioStatus("stopped");
  };

  const reset = () => {
    invalidateAudioSession();
    started.current = false;
    onReset();
  };

  return (
    <section className="opening-experience" aria-label="開栓体験">
      <div className="opening-artwork" data-opening-status={status}>
        <OpeningCanvas
          recipe={recipe}
          visualTimeMs={visualTimeMs}
          animating={status === "playing"}
          reducedMotion={reducedMotion}
          {...(animationDriver === undefined ? {} : { animationDriver })}
        />
        <p className="opening-artwork-caption" aria-live="polite">
          {status === "ready" && "開栓すると、作品が静かに動き始めます。"}
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
          onClick={start}
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
    case "starting":
      return "音声を準備しています。作品は再生中です。";
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
