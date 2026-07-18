import { ParticipantExperienceScreen } from "./participant/ParticipantExperience";
import { getParticipantTestConfiguration } from "./application/participant/test-configuration";

export function App() {
  const testConfiguration = getParticipantTestConfiguration(
    window.location.search,
    import.meta.env.VITE_ENABLE_E2E_MODE === "true",
  );

  return <ParticipantExperienceScreen {...(testConfiguration ?? {})} />;
}
