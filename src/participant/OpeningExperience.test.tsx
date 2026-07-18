import { render, screen } from "@testing-library/react";
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
});
