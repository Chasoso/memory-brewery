import type { Clock } from "../../domain/brewing/clock";

export type ParticipantTestConfiguration = {
  seed: string;
  odoriDurationMs: number;
  openingDurationMs: number;
  clock: Clock;
};

export function getParticipantTestConfiguration(
  search: string,
  e2eModeEnabled: boolean,
): ParticipantTestConfiguration | undefined {
  if (!e2eModeEnabled || new URLSearchParams(search).get("test") !== "1") {
    return undefined;
  }

  return {
    seed: "e2e-fixed-seed",
    odoriDurationMs: 10,
    openingDurationMs: 20,
    clock: { now: () => "2026-07-18T00:00:00.000Z" },
  };
}
