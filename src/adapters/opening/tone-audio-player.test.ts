import { describe, expect, it } from "vitest";

import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../../application/participant/experience";
import { createFixedClock } from "../../test-support/brewing";
import { NoOpAudioPlayer } from "./no-op-audio-player";
import { mapAudioRecipe } from "./tone-audio-player";

function audioRecipe() {
  const experience = loadParticipantExperience();
  const landMemoryId = experience.landMemories[0]?.id;
  if (landMemoryId === undefined) throw new Error("Expected fixture.");
  return completeBrewingSession({
    experience,
    seed: "audio-mapping",
    clock: createFixedClock(),
    participantInput: {
      initial: {
        colorToken: "koji",
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
  }).audio;
}

describe("audio mapping and no-op adapter", () => {
  it("maps an AudioRecipe deterministically into quiet bounded notes", () => {
    const mapped = mapAudioRecipe(audioRecipe());
    expect(mapped).toEqual(mapAudioRecipe(audioRecipe()));
    expect(mapped.noteNames.length).toBeGreaterThanOrEqual(4);
    expect(mapped.noteNames.length).toBeLessThanOrEqual(8);
    expect(mapped.intervalSeconds).toBeGreaterThanOrEqual(0.28);
    expect(mapped.velocity).toBeLessThanOrEqual(0.38);
  });

  it("allows a silent flow without hiding its unavailable state", async () => {
    const player = new NoOpAudioPlayer("unavailable");
    await expect(player.start(audioRecipe())).resolves.toBe("unavailable");
    player.stop();
    player.dispose();
  });
});
