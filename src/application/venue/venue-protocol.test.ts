import { describe, expect, it } from "vitest";
import {
  completeBrewingSession,
  loadParticipantExperience,
} from "../participant/experience";
import { createFixedClock } from "../../test-support/brewing";
import { VenueMessageSchema, VenueSnapshotSchema } from "./venue-protocol";

function sampleRecipe() {
  const experience = loadParticipantExperience();
  const land = experience.landMemories[0];
  if (!land) throw new Error("fixture missing");
  return completeBrewingSession({
    experience,
    seed: "protocol",
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
describe("venue protocol", () => {
  it("accepts serializable publish and clear messages while rejecting unknown versions", () => {
    const recipe = sampleRecipe();
    expect(
      VenueMessageSchema.safeParse(
        JSON.parse(
          JSON.stringify({
            protocolVersion: 1,
            type: "recipe-published",
            messageId: "message-1",
            sentAt: "2026-07-18T00:00:00.000Z",
            recipe,
          }),
        ),
      ).success,
    ).toBe(true);
    expect(
      VenueMessageSchema.safeParse({
        protocolVersion: 2,
        type: "collection-cleared",
        messageId: "clear",
        sentAt: "2026-07-18T00:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      VenueSnapshotSchema.safeParse({
        snapshotVersion: 1,
        updatedAt: "2026-07-18T00:00:00.000Z",
        recipes: [recipe],
      }).success,
    ).toBe(true);
  });
});
