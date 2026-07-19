import { useEffect, useMemo, useState } from "react";
import { LocalVenueSync } from "./adapters/venue/local-venue-sync";
import { loadParticipantEntry } from "./application/participant/participant-entry";
import { DEFAULT_SAKE_ID } from "./application/participant/sake-selection";
import { ParticipantExperienceScreen } from "./participant/ParticipantExperience";
import { getParticipantTestConfiguration } from "./application/participant/test-configuration";

export function App() {
  const [venueSync, setVenueSync] = useState<LocalVenueSync>();
  const [search, setSearch] = useState(() => window.location.search);
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
    search,
    import.meta.env.VITE_ENABLE_E2E_MODE === "true",
  );
  const entry = useMemo(() => loadParticipantEntry(search), [search]);
  const selectSake = (sakeId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("sake_id", sakeId);
    window.history.replaceState(null, "", url);
    setSearch(url.search);
  };

  if (venueSync === undefined) return null;
  if (entry.status === "unknown" || entry.status === "invalid") {
    return (
      <SakeEntryError
        status={entry.status}
        availableSakes={entry.availableSakes}
        onSelect={selectSake}
      />
    );
  }
  if (entry.status === "fixture-error") {
    return (
      <SakeEntryError
        status="fixture-error"
        availableSakes={[]}
        onSelect={selectSake}
      />
    );
  }
  if (!("experience" in entry)) return null;
  return (
    <ParticipantExperienceScreen
      recipePublisher={venueSync}
      experience={entry.experience}
      selectionStatus={entry.status}
      {...(testConfiguration ?? {})}
    />
  );
}

function SakeEntryError({
  status,
  availableSakes,
  onSelect,
}: {
  status: "unknown" | "invalid" | "fixture-error";
  availableSakes: { id: string; productName: string }[];
  onSelect: (sakeId: string) => void;
}) {
  const message =
    status === "unknown"
      ? "指定された酒が見つかりません。"
      : status === "invalid"
        ? "酒の指定形式を確認してください。"
        : "酒の準備を読み込めませんでした。";
  return (
    <main className="participant-shell">
      <section
        className="participant-screen"
        aria-labelledby="sake-entry-error-title"
      >
        <p className="step-label">一献</p>
        <h1 id="sake-entry-error-title">対象の酒を選び直してください</h1>
        <p className="field-error" role="alert">
          {message}
        </p>
        {availableSakes.length > 0 && (
          <div className="gesture-actions" aria-label="利用可能な開発用日本酒">
            {availableSakes.map((sake) => (
              <button
                key={sake.id}
                className="text-button"
                type="button"
                onClick={() => onSelect(sake.id)}
              >
                {sake.productName} を開く
              </button>
            ))}
          </div>
        )}
        {status !== "fixture-error" && (
          <button
            className="primary-button"
            type="button"
            onClick={() => onSelect(DEFAULT_SAKE_ID)}
          >
            既定の酒で始める
          </button>
        )}
      </section>
    </main>
  );
}
