import { ParticipantExperienceScreen } from "./participant/ParticipantExperience";

export function App() {
  const parameters = new URLSearchParams(window.location.search);
  const testMode = parameters.get("test") === "1";

  return (
    <ParticipantExperienceScreen
      {...(testMode
        ? {
            seed: "e2e-fixed-seed",
            odoriDurationMs: 10,
            clock: { now: () => "2026-07-18T00:00:00.000Z" },
          }
        : {})}
    />
  );
}
