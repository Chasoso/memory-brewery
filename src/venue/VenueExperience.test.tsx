import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LocalVenueSync,
  type VenueChange,
} from "../adapters/venue/local-venue-sync";
import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../application/participant/experience";
import { createFixedClock } from "../test-support/brewing";
import { VenueExperience } from "./VenueExperience";

class FakeVenueSync {
  listeners = new Set<(change: VenueChange) => void>();
  dispose = vi.fn();
  load = vi.fn(() => []);
  subscribe = vi.fn((listener: (change: VenueChange) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  });
  clear = vi.fn(() => true);
  emit(change: VenueChange) {
    this.listeners.forEach((listener) => listener(change));
  }
}

function recipe() {
  const experience = loadParticipantExperience();
  const land = experience.landMemories[0];
  if (!land) throw new Error("fixture missing");
  return completeBrewingSession({
    experience,
    seed: "venue-component",
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
      naka: { landMemoryId: land.id },
      tome: { scenario: "quiet-evening" },
    },
  });
}

afterEach(() => vi.useRealTimers());

describe("VenueExperience lifecycle", () => {
  it("does not dispose an externally provided sync and clears an arrival caption after four seconds", async () => {
    vi.useFakeTimers();
    const sync = new FakeVenueSync();
    const result = render(
      <VenueExperience sync={sync as unknown as LocalVenueSync} />,
    );
    act(() =>
      sync.emit({
        type: "recipes",
        recipes: [recipe()],
        latestRecipeId: "new",
      }),
    );
    expect(screen.getByText("新しい記憶が重なりました。")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(
      screen.queryByText("新しい記憶が重なりました。"),
    ).not.toBeInTheDocument();
    result.unmount();
    expect(sync.dispose).not.toHaveBeenCalled();
  });

  it("disposes owned sync once per mount, including Strict Mode remounts", async () => {
    const dispose = vi.spyOn(LocalVenueSync.prototype, "dispose");
    const normal = render(<VenueExperience />);
    await act(async () => {
      await Promise.resolve();
    });
    normal.unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
    dispose.mockClear();
    const strict = render(
      <StrictMode>
        <VenueExperience />
      </StrictMode>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    strict.unmount();
    expect(dispose).toHaveBeenCalledTimes(2);
    dispose.mockRestore();
  });
});
