import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../application/participant/experience";
import { FakeAudioPlayer } from "../test-support/opening";
import { createFixedClock } from "../test-support/brewing";
import { OpeningExperience } from "./OpeningExperience";

function recipe() {
  const experience = loadParticipantExperience();
  const landMemoryId = experience.landMemories[0]?.id;
  if (landMemoryId === undefined) throw new Error("Expected fixture.");
  return completeBrewingSession({
    experience,
    seed: "opening-component",
    clock: createFixedClock(),
    participantInput: {
      initial: {
        colorToken: "ferment",
        gesture: {
          kind: "summary",
          pointCount: 2,
          averageSpeed: 1,
          travelDistance: 2,
          directionChanges: 0,
          intensity: 0.2,
          density: 0.2,
        },
      },
      naka: { landMemoryId },
      tome: { scenario: "quiet-evening" },
    },
  });
}

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe("OpeningExperience", () => {
  it("starts Canvas timing while audio initialization is unresolved", () => {
    let resolveStart: ((status: "playing") => void) | undefined;
    const audio = new FakeAudioPlayer();
    audio.start = vi.fn(
      () =>
        new Promise((resolve: (status: "playing") => void) => {
          audio.starts += 1;
          resolveStart = resolve;
        }),
    );
    render(
      <OpeningExperience
        recipe={recipe()}
        onReset={vi.fn()}
        audioPlayerFactory={() => audio}
        openingDurationMs={1000}
      />,
    );

    fireEvent.click(screen.getByLabelText("音声を使う"));
    fireEvent.click(screen.getByRole("button", { name: /開栓する/ }));

    expect(screen.getByText("作品を再生中です。")).toBeInTheDocument();
    expect(
      screen.getByText("音声を準備しています。作品は再生中です。"),
    ).toBeInTheDocument();
    expect(audio.starts).toBe(1);
    resolveStart?.("playing");
  });

  it("does not autoplay and completes visually without audio", async () => {
    const user = userEvent.setup();
    render(
      <OpeningExperience
        recipe={recipe()}
        onReset={vi.fn()}
        openingDurationMs={25}
      />,
    );
    expect(
      screen.getByText("音声は開栓操作のあとにのみ開始します。"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /開栓する/ }));
    expect(
      await screen.findByText("音声なしで作品を表示しています。"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("作品は静かな余韻として残っています。"),
    ).toBeInTheDocument();
  });

  it("continues the visual flow after audio initialization fails and resets safely", async () => {
    const user = userEvent.setup();
    const audio = new FakeAudioPlayer("failed");
    const onReset = vi.fn();
    render(
      <OpeningExperience
        recipe={recipe()}
        onReset={onReset}
        audioPlayerFactory={() => audio}
        openingDurationMs={1000}
      />,
    );
    await user.click(screen.getByLabelText("音声を使う"));
    await user.click(screen.getByRole("button", { name: /開栓する/ }));
    expect(
      await screen.findByText(/音声を開始できませんでした/),
    ).toBeInTheDocument();
    expect(screen.getByText("作品を再生中です。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "最初から仕込む" }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(audio.disposals).toBe(1);
  });

  it("finishes the Canvas while audio initialization is unresolved", async () => {
    const audio = new FakeAudioPlayer();
    audio.start = vi.fn(
      () =>
        new Promise<
          import("../application/opening/audio-player").AudioPlaybackStatus
        >(() => {}),
    );
    render(
      <OpeningExperience
        recipe={recipe()}
        onReset={vi.fn()}
        audioPlayerFactory={() => audio}
        openingDurationMs={25}
      />,
    );
    fireEvent.click(screen.getByLabelText("音声を使う"));
    fireEvent.click(screen.getByRole("button", { name: /開栓する/ }));
    expect(
      await screen.findByText("作品は静かな余韻として残っています。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-visual-time-ms",
      "25",
    );
  });

  it("invalidates a delayed audio start on reset and on unmount", () => {
    const pending = () => new Promise<"playing">(() => {});
    const resetAudio = new FakeAudioPlayer();
    resetAudio.start = vi.fn(pending);
    const reset = vi.fn();
    const first = render(
      <OpeningExperience
        recipe={recipe()}
        onReset={reset}
        audioPlayerFactory={() => resetAudio}
      />,
    );
    fireEvent.click(screen.getByLabelText("音声を使う"));
    fireEvent.click(screen.getByRole("button", { name: /開栓する/ }));
    fireEvent.click(screen.getByRole("button", { name: "最初から仕込む" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(resetAudio.disposals).toBe(1);
    first.unmount();

    const unmountAudio = new FakeAudioPlayer();
    unmountAudio.start = vi.fn(pending);
    const second = render(
      <OpeningExperience
        recipe={recipe()}
        onReset={vi.fn()}
        audioPlayerFactory={() => unmountAudio}
      />,
    );
    fireEvent.click(screen.getByLabelText("音声を使う"));
    fireEvent.click(screen.getByRole("button", { name: /開栓する/ }));
    second.unmount();
    expect(unmountAudio.disposals).toBe(1);
  });

  it("uses completion time after playback and resets visual time for replay", async () => {
    render(
      <OpeningExperience
        recipe={recipe()}
        onReset={vi.fn()}
        openingDurationMs={25}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /開栓する/ }));
    await screen.findByText("作品は静かな余韻として残っています。");
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-visual-time-ms",
      "25",
    );
    fireEvent.click(screen.getByRole("button", { name: "もう一度見る" }));
    expect(screen.getByRole("img")).toHaveAttribute("data-visual-time-ms", "0");
  });
});
