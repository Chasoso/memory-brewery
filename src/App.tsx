import { useEffect, useState } from "react";
import { LocalVenueSync } from "./adapters/venue/local-venue-sync";
import { ParticipantExperienceScreen } from "./participant/ParticipantExperience";
import { getParticipantTestConfiguration } from "./application/participant/test-configuration";

export function App() {
  const [venueSync, setVenueSync] = useState<LocalVenueSync>();
  useEffect(() => {
    const sync = new LocalVenueSync();
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setVenueSync(sync);
    });
    return () => {
      active = false;
      sync.dispose();
    };
  }, []);
  const testConfiguration = getParticipantTestConfiguration(
    window.location.search,
    import.meta.env.VITE_ENABLE_E2E_MODE === "true",
  );

  if (venueSync === undefined) return null;
  return (
    <ParticipantExperienceScreen
      recipePublisher={venueSync}
      {...(testConfiguration ?? {})}
    />
  );
}
