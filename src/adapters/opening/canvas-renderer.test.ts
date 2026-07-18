import { describe, expect, it, vi } from "vitest";

import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../../application/participant/experience";
import { createFixedClock } from "../../test-support/brewing";
import { normalizeCanvasSize, renderOpeningCanvas } from "./canvas-renderer";

function recipe() {
  const experience = loadParticipantExperience();
  const landMemoryId = experience.landMemories[0]?.id;
  if (landMemoryId === undefined) throw new Error("Expected fixture.");
  return completeBrewingSession({
    experience,
    seed: "canvas-renderer",
    clock: createFixedClock(),
    participantInput: {
      initial: {
        colorToken: "water",
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
      tome: { scenario: "reunion" },
    },
  });
}

function context() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe("canvas renderer", () => {
  it("normalizes DPR and rejects zero dimensions safely", () => {
    expect(normalizeCanvasSize(100, 80, 4)).toEqual({
      width: 100,
      height: 80,
      pixelRatio: 2,
    });
    expect(
      renderOpeningCanvas(
        context(),
        recipe(),
        normalizeCanvasSize(0, 80, 1),
        0,
        false,
      ),
    ).toBeUndefined();
  });

  it("emits the same drawing state at the same time after a resize", () => {
    const first = renderOpeningCanvas(
      context(),
      recipe(),
      normalizeCanvasSize(320, 250, 1),
      900,
      false,
    );
    const resized = renderOpeningCanvas(
      context(),
      recipe(),
      normalizeCanvasSize(430, 300, 2),
      900,
      false,
    );
    expect(first?.marks.length).toBe(resized?.marks.length);
    expect(first?.backgroundToken).toBe(resized?.backgroundToken);
  });
});
