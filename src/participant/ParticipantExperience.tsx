import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  accessibleGesture,
  appendGesturePoint,
  summarizeGesture,
  type GesturePoint,
} from "../application/participant/gesture";
import {
  completeBrewingSession,
  loadParticipantExperience,
  type ParticipantExperience,
} from "../application/participant/experience";
import {
  initialParticipantFlowState,
  participantFlowReducer,
} from "../application/participant/flow";
import { systemClock, type Clock } from "../domain/brewing/clock";
import type { ParticipantInput } from "../domain/brewing/schemas";
import type { AnimationDriver } from "../application/opening/animation-driver";
import type { AudioPlayer } from "../application/opening/audio-player";
import { OpeningExperience } from "./OpeningExperience";
import type { RecipePublisher } from "../application/venue/venue-protocol";
import "./participant.css";

const defaultOdoriDurationMs = 10_000;

export type ParticipantExperienceProps = {
  experience?: ParticipantExperience;
  selectionStatus?: "selected" | "defaulted";
  seed?: string;
  clock?: Clock;
  odoriDurationMs?: number;
  openingDurationMs?: number;
  animationDriver?: AnimationDriver;
  audioPlayerFactory?: () => AudioPlayer;
  recipePublisher?: RecipePublisher;
};

const colorChoices: {
  token: ParticipantInput["initial"]["colorToken"];
  label: string;
}[] = [
  { token: "ferment", label: "発酵の緑" },
  { token: "earth", label: "土の茶" },
  { token: "koji", label: "麹の黄" },
  { token: "water", label: "水の青" },
  { token: "rice", label: "米の白" },
];

const scenarioChoices: {
  scenario: NonNullable<ParticipantInput["tome"]["scenario"]>;
  label: string;
  hint: string;
}[] = [
  { scenario: "celebration", label: "家族の祝い", hint: "大切な人と" },
  { scenario: "seasonal-visit", label: "次の雪の日", hint: "季節がめぐったら" },
  { scenario: "reunion", label: "友人との再会", hint: "また会えたとき" },
  { scenario: "quiet-evening", label: "静かな夜", hint: "ひとりでゆっくり" },
];

export function ParticipantExperienceScreen({
  experience: suppliedExperience,
  selectionStatus,
  seed: suppliedSeed,
  clock = systemClock,
  odoriDurationMs = defaultOdoriDurationMs,
  openingDurationMs,
  animationDriver,
  audioPlayerFactory,
  recipePublisher,
}: ParticipantExperienceProps) {
  const [flow, dispatch] = useReducer(
    participantFlowReducer,
    initialParticipantFlowState,
  );
  const [points, setPoints] = useState<GesturePoint[]>([]);
  const [error, setError] = useState<string | undefined>();
  const generatedSeed = useRef(suppliedSeed ?? createSessionSeed());
  const experienceResult = useMemo(() => {
    try {
      return { experience: suppliedExperience ?? loadParticipantExperience() };
    } catch {
      return {
        error:
          "仕込みの素材を読み込めませんでした。時間をおいて、最初から試してください。",
      };
    }
  }, [suppliedExperience]);

  useEffect(() => {
    if (flow.step !== "odori") return undefined;
    const timer = window.setTimeout(
      () => dispatch({ type: "finish-odori" }),
      odoriDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [flow.step, odoriDurationMs]);

  if (experienceResult.error !== undefined) {
    return <SafeError message={experienceResult.error} />;
  }
  const experience = experienceResult.experience;
  if (experience === undefined) {
    return <SafeError message="仕込みの素材を読み込めませんでした。" />;
  }

  const updateGesture = (nextPoints: GesturePoint[]) => {
    setPoints(nextPoints);
    dispatch({ type: "set-gesture", gesture: summarizeGesture(nextPoints) });
  };
  const reset = () => {
    generatedSeed.current = suppliedSeed ?? createSessionSeed();
    setPoints([]);
    setError(undefined);
    dispatch({ type: "reset" });
  };
  const complete = () => {
    if (flow.landMemoryId === undefined) return;
    try {
      const participantInput: ParticipantInput = {
        initial: { colorToken: flow.colorToken, gesture: flow.gesture },
        naka: { landMemoryId: flow.landMemoryId },
        tome: {
          ...(flow.scenario === undefined ? {} : { scenario: flow.scenario }),
          ...(flow.freeText.trim() === ""
            ? {}
            : { freeText: flow.freeText.trim() }),
        },
      };
      const recipe = completeBrewingSession({
        experience,
        participantInput,
        seed: generatedSeed.current,
        clock,
      });
      setError(undefined);
      dispatch({ type: "set-result", recipe });
    } catch {
      setError("入力を確認してから、もう一度仕込みを完了してください。");
    }
  };

  return (
    <main className="participant-shell">
      <div className="participant-grain" aria-hidden="true" />
      <header className="participant-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">MEMORY BREWERY</p>
            <h1>記憶醸造所</h1>
          </div>
        </div>
        <span className="sound-placeholder" aria-label="音は次の工程で対応予定">
          音
        </span>
      </header>

      {flow.step === "intro" && (
        <Intro
          experience={experience}
          selectionStatus={selectionStatus}
          onStart={() => dispatch({ type: "start" })}
        />
      )}
      {flow.step === "initial" && (
        <InitialStep
          colorToken={flow.colorToken}
          gestureReady={flow.gesture.kind === "summary"}
          points={points}
          onColor={(colorToken) => dispatch({ type: "set-color", colorToken })}
          onPoints={updateGesture}
          onClear={() => updateGesture([])}
          onAccessibleGesture={() => {
            setPoints([]);
            dispatch({ type: "set-gesture", gesture: accessibleGesture });
          }}
          onBack={() => dispatch({ type: "back" })}
          onNext={() => dispatch({ type: "start-odori" })}
        />
      )}
      {flow.step === "odori" && (
        <Odori
          durationMs={odoriDurationMs}
          onBack={() => dispatch({ type: "back" })}
        />
      )}
      {flow.step === "naka" && (
        <NakaStep
          experience={experience}
          selectedId={flow.landMemoryId}
          onSelect={(landMemoryId) =>
            dispatch({ type: "set-land", landMemoryId })
          }
          onBack={() => dispatch({ type: "back" })}
          onNext={() => dispatch({ type: "to-tome" })}
        />
      )}
      {flow.step === "tome" && (
        <TomeStep
          scenario={flow.scenario}
          freeText={flow.freeText}
          error={error}
          onScenario={(scenario) => {
            setError(undefined);
            dispatch({ type: "set-scenario", scenario });
          }}
          onFreeText={(freeText) => {
            setError(undefined);
            dispatch({ type: "set-free-text", freeText });
          }}
          onBack={() => dispatch({ type: "back" })}
          onComplete={complete}
        />
      )}
      {flow.step === "result" && flow.recipe !== undefined && (
        <Result
          recipe={flow.recipe}
          experience={experience}
          onReset={reset}
          {...(openingDurationMs === undefined ? {} : { openingDurationMs })}
          {...(animationDriver === undefined ? {} : { animationDriver })}
          {...(audioPlayerFactory === undefined ? {} : { audioPlayerFactory })}
          {...(recipePublisher === undefined ? {} : { recipePublisher })}
        />
      )}
    </main>
  );
}

function Intro({
  experience,
  selectionStatus,
  onStart,
}: {
  experience: ParticipantExperience;
  selectionStatus?: "selected" | "defaulted";
  onStart: () => void;
}) {
  const { sake } = experience;
  return (
    <section
      className="participant-screen intro-screen"
      aria-labelledby="intro-title"
    >
      <div className="hero-visual" aria-hidden="true">
        <span className="hero-orbit orbit-a" />
        <span className="hero-orbit orbit-b" />
      </div>
      <div className="content-block intro-copy">
        <p className="step-label">一献</p>
        <h2 id="intro-title">
          この一杯に、
          <br />
          あなたの記憶を仕込みます。
        </h2>
        <p className="lead">
          飲酒しなくても、香り、ラベル、説明、土地の印象から参加できます。
        </p>
      </div>
      <article className="sake-card" aria-label="本日の開発用日本酒fixture">
        <div>
          <p className="micro-label">DEVELOPMENT SAKE</p>
          <h3>
            {sake.breweryName}
            <span>{sake.productName}</span>
          </h3>
          <p>
            {sake.category} · {sake.featureSummary}
          </p>
          <p className="micro-label">sake_id: {sake.id}</p>
          {selectionStatus === "defaulted" && (
            <p className="micro-label">既定の開発用日本酒</p>
          )}
        </div>
        <span className="sake-seal" aria-hidden="true">
          開発用
        </span>
      </article>
      <BottomAction
        label="三段仕込みをはじめる"
        onClick={onStart}
        note="この一杯から生まれた記憶を、三回に分けて仕込みます。"
      />
    </section>
  );
}

function InitialStep(props: {
  colorToken: ParticipantInput["initial"]["colorToken"];
  gestureReady: boolean;
  points: GesturePoint[];
  onColor: (token: ParticipantInput["initial"]["colorToken"]) => void;
  onPoints: (points: GesturePoint[]) => void;
  onClear: () => void;
  onAccessibleGesture: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="participant-screen" aria-labelledby="initial-title">
      <StepHeader
        label="初添"
        count="1 / 3"
        title={
          <>
            この一杯を、
            <br />
            色と動きで表すなら？
          </>
        }
      />
      <GesturePad points={props.points} onPoints={props.onPoints} />
      <div className="color-tray" role="radiogroup" aria-label="色を選択">
        {colorChoices.map(({ token, label }) => (
          <button
            key={token}
            className={`color-chip color-chip--${token} ${props.colorToken === token ? "is-selected" : ""}`}
            type="button"
            role="radio"
            aria-checked={props.colorToken === token}
            onClick={() => props.onColor(token)}
          >
            <span className="sr-only">
              {label}
              {props.colorToken === token ? "、選択中" : ""}
            </span>
          </button>
        ))}
      </div>
      <div className="gesture-actions">
        <button type="button" className="text-button" onClick={props.onClear}>
          描き直す
        </button>
        <button
          type="button"
          className="text-button"
          onClick={props.onAccessibleGesture}
        >
          動きの代替入力を使う
        </button>
      </div>
      <p className="inline-status" aria-live="polite">
        {props.gestureReady
          ? "色と動きを受け取りました。"
          : "色を選び、指・ペン・マウスで線を描くか、動きの代替入力を選んでください。"}
      </p>
      <BottomAction
        label="この感覚を仕込みへ"
        onClick={props.onNext}
        disabled={!props.gestureReady}
        secondary="一献へ戻る"
        onSecondary={props.onBack}
      />
    </section>
  );
}

function GesturePad({
  points,
  onPoints,
}: {
  points: GesturePoint[];
  onPoints: (points: GesturePoint[]) => void;
}) {
  const activePointer = useRef<number | undefined>(undefined);
  const toPoint = (event: React.PointerEvent<SVGSVGElement>): GesturePoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      at: event.timeStamp,
    };
  };
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  return (
    <div className="gesture-stage">
      <svg
        className="gesture-pad"
        viewBox="0 0 360 360"
        role="img"
        aria-label="指、ペン、またはマウスで動きを描く入力領域"
        onPointerDown={(event) => {
          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          onPoints(appendGesturePoint([], toPoint(event)));
        }}
        onPointerMove={(event) => {
          if (activePointer.current === event.pointerId)
            onPoints(appendGesturePoint(points, toPoint(event)));
        }}
        onPointerUp={(event) => {
          if (activePointer.current === event.pointerId) {
            activePointer.current = undefined;
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          activePointer.current = undefined;
        }}
      >
        <path d={path} className="gesture-path" fill="none" />
      </svg>
      <p className="stage-hint">画面に触れて、感じた動きを描いてください</p>
    </div>
  );
}

function Odori({
  durationMs,
  onBack,
}: {
  durationMs: number;
  onBack: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));
  useEffect(() => {
    const started = performance.now();
    const interval = window.setInterval(
      () =>
        setRemaining(
          Math.max(
            0,
            Math.ceil((durationMs - (performance.now() - started)) / 1000),
          ),
        ),
      200,
    );
    return () => window.clearInterval(interval);
  }, [durationMs]);
  return (
    <section
      className="participant-screen centered-screen"
      aria-labelledby="odori-title"
    >
      <div className="odori-visual" aria-hidden="true">
        <span className="breath-ring" />
      </div>
      <p className="step-label">踊り</p>
      <h2 id="odori-title">仕込みを、少し休ませます。</h2>
      <p className="lead narrow">
        もう一度、香りや余韻を感じてください。記憶が静かに動きはじめます。
      </p>
      <p className="odori-timer" aria-live="polite">
        <span>{remaining}</span>
        <small>sec</small>
      </p>
      <button type="button" className="text-button" onClick={onBack}>
        初添に戻る
      </button>
    </section>
  );
}

function NakaStep({
  experience,
  selectedId,
  onSelect,
  onBack,
  onNext,
}: {
  experience: ParticipantExperience;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="participant-screen" aria-labelledby="naka-title">
      <StepHeader
        label="仲添"
        count="2 / 3"
        title={
          <>
            この一杯に、
            <br />
            どの石川を重ねますか？
          </>
        }
      />
      <div
        className="land-list"
        role="radiogroup"
        aria-label="土地の記憶を選択"
      >
        {experience.landMemories.map((land) => (
          <button
            type="button"
            key={land.id}
            role="radio"
            aria-checked={land.id === selectedId}
            className={`land-card ${land.id === selectedId ? "is-selected" : ""}`}
            onClick={() => onSelect(land.id)}
          >
            <span className="land-glyph" aria-hidden="true" />
            <span>
              <strong>{land.displayName}</strong>
              <small>{land.region}</small>
              <em>{land.generativeDescription}</em>
            </span>
            <b>{land.id === selectedId ? "選択中" : land.tags[0]}</b>
          </button>
        ))}
      </div>
      <p className="source-note">
        開発用の合成fixtureから、土地の印象だけを選んでいます。
      </p>
      <BottomAction
        label="土地の記憶を重ねる"
        onClick={onNext}
        disabled={selectedId === undefined}
        secondary="初添へ戻る"
        onSecondary={onBack}
      />
    </section>
  );
}

function TomeStep({
  scenario,
  freeText,
  error,
  onScenario,
  onFreeText,
  onBack,
  onComplete,
}: {
  scenario: ParticipantInput["tome"]["scenario"];
  freeText: string;
  error: string | undefined;
  onScenario: (
    scenario: NonNullable<ParticipantInput["tome"]["scenario"]>,
  ) => void;
  onFreeText: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const ready = scenario !== undefined || freeText.trim() !== "";
  return (
    <section className="participant-screen" aria-labelledby="tome-title">
      <StepHeader
        label="留添"
        count="3 / 3"
        title={
          <>
            この酒を、次はどんな場面で
            <br />
            開けたいですか？
          </>
        }
      />
      <div
        className="future-grid"
        role="radiogroup"
        aria-label="未来の場面を選択"
      >
        {scenarioChoices.map((choice) => (
          <button
            key={choice.scenario}
            type="button"
            role="radio"
            aria-checked={scenario === choice.scenario}
            className={`future-card ${scenario === choice.scenario ? "is-selected" : ""}`}
            onClick={() => onScenario(choice.scenario)}
          >
            <span>{choice.hint}</span>
            <strong>{choice.label}</strong>
          </button>
        ))}
      </div>
      <label className="free-input" htmlFor="future-input">
        <span>または、あなたの言葉で</span>
        <input
          id="future-input"
          value={freeText}
          maxLength={120}
          onChange={(event) => onFreeText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (ready) onComplete();
            }
          }}
          placeholder="次にこの酒を開けたい場面"
          aria-describedby="future-count future-error"
        />
        <small id="future-count">{freeText.length} / 120</small>
      </label>
      {error !== undefined && (
        <p id="future-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <BottomAction
        label="三段の仕込みを完了する"
        onClick={onComplete}
        disabled={!ready}
        secondary="仲添へ戻る"
        onSecondary={onBack}
      />
    </section>
  );
}

function Result({
  recipe,
  experience,
  onReset,
  openingDurationMs,
  animationDriver,
  audioPlayerFactory,
  recipePublisher,
}: {
  recipe: NonNullable<ReturnType<typeof completeBrewingSession>>;
  experience: ParticipantExperience;
  onReset: () => void;
  openingDurationMs?: number;
  animationDriver?: AnimationDriver;
  audioPlayerFactory?: () => AudioPlayer;
  recipePublisher?: RecipePublisher;
}) {
  const land = experience.landMemories.find(
    (item) => item.id === recipe.landMemoryId,
  );
  return (
    <section
      className="participant-screen result-screen"
      aria-labelledby="result-title"
    >
      <p className="step-label">開栓準備</p>
      <p className="opening-kicker">三段の仕込みが完了しました。</p>
      <h2 id="result-title">
        あなたの記憶酒を
        <br />
        開栓します。
      </h2>
      <p className="result-title">{recipe.title}</p>
      <p className="lead">{recipe.description}</p>
      <OpeningExperience
        recipe={recipe}
        onReset={onReset}
        {...(openingDurationMs === undefined ? {} : { openingDurationMs })}
        {...(animationDriver === undefined ? {} : { animationDriver })}
        {...(audioPlayerFactory === undefined ? {} : { audioPlayerFactory })}
        {...(recipePublisher === undefined ? {} : { recipePublisher })}
      />
      <dl className="recipe-strip">
        <div>
          <dt>一献</dt>
          <dd>{experience.sake.productName}</dd>
        </div>
        <div>
          <dt>初添</dt>
          <dd>
            {recipe.participantInput.initial.colorToken} /{" "}
            {recipe.participantInput.initial.gesture.kind === "summary"
              ? `${recipe.participantInput.initial.gesture.pointCount}点の動き`
              : "入力なし"}
          </dd>
        </div>
        <div>
          <dt>仲添</dt>
          <dd>{land?.displayName ?? "選択した土地"}</dd>
        </div>
        <div>
          <dt>留添</dt>
          <dd>
            {recipe.participantInput.tome.freeText ??
              scenarioChoices.find(
                (item) =>
                  item.scenario === recipe.participantInput.tome.scenario,
              )?.label}
          </dd>
        </div>
      </dl>
      <p className="pending-note">
        音と完成ビジュアルは、次の工程でこのレシピへ接続されます。
      </p>
      <p className="recipe-id">Recipe ID: {recipe.recipeId}</p>
      <BottomAction label="最初から仕込む" onClick={onReset} />
    </section>
  );
}

function StepHeader({
  label,
  count,
  title,
}: {
  label: string;
  count: string;
  title: React.ReactNode;
}) {
  return (
    <div className="progress-header">
      <div>
        <p className="step-label">{label}</p>
        <h2>{title}</h2>
      </div>
      <span className="step-count">{count}</span>
    </div>
  );
}
function BottomAction({
  label,
  onClick,
  disabled,
  note,
  secondary,
  onSecondary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  note?: string;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="bottom-action">
      <button
        className="primary-button"
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        {label}
        <span aria-hidden="true">→</span>
      </button>
      {note !== undefined && <p className="assistive-note">{note}</p>}
      {secondary !== undefined && onSecondary !== undefined && (
        <button className="back-button" type="button" onClick={onSecondary}>
          {secondary}
        </button>
      )}
    </div>
  );
}
function SafeError({ message }: { message: string }) {
  return (
    <main className="participant-shell">
      <section className="participant-screen">
        <h1>記憶醸造所</h1>
        <p role="alert" className="field-error">
          {message}
        </p>
      </section>
    </main>
  );
}

function createSessionSeed(): string {
  const values = new Uint32Array(2);
  globalThis.crypto.getRandomValues(values);
  return `participant-${values[0]?.toString(16) ?? "0"}-${values[1]?.toString(16) ?? "0"}`;
}
