import { useEffect, useMemo, useState } from "react";

import { LocalVenueSync } from "../adapters/venue/local-venue-sync";
import { createVenueAggregate } from "../application/venue/venue-scene";
import { createVenueLandSummaries } from "../application/venue/venue-view-model";
import type { BrewingRecipe } from "../domain/brewing/schemas";
import { VenueCanvas } from "./VenueCanvas";
import "./venue.css";

export function VenueExperience({
  sync: providedSync,
}: {
  sync?: LocalVenueSync;
}) {
  if (providedSync !== undefined) return <VenueContent sync={providedSync} />;
  return <OwnedVenueExperience />;
}

function OwnedVenueExperience() {
  const [sync, setSync] = useState<LocalVenueSync>();
  useEffect(() => {
    const ownedSync = new LocalVenueSync();
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setSync(ownedSync);
    });
    return () => {
      active = false;
      ownedSync.dispose();
    };
  }, []);
  if (sync === undefined) return null;
  return <VenueContent sync={sync} />;
}

function VenueContent({ sync }: { sync: LocalVenueSync }) {
  const [recipes, setRecipes] = useState<BrewingRecipe[]>(() => sync.load());
  const [latestRecipeId, setLatestRecipeId] = useState<string | undefined>();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const fixedTimeMs =
    import.meta.env.VITE_ENABLE_E2E_MODE === "true" &&
    new URLSearchParams(window.location.search).get("test") === "1"
      ? 1000
      : undefined;
  useEffect(() => {
    const unsubscribe = sync.subscribe((change) => {
      setRecipes(change.recipes);
      setLatestRecipeId(
        change.type === "recipes" ? change.latestRecipeId : undefined,
      );
    });
    return () => {
      unsubscribe();
    };
  }, [sync]);
  useEffect(() => {
    if (latestRecipeId === undefined) return undefined;
    const timer = window.setTimeout(() => setLatestRecipeId(undefined), 4000);
    return () => window.clearTimeout(timer);
  }, [latestRecipeId]);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const aggregate = useMemo(() => createVenueAggregate(recipes), [recipes]);
  const landEntries = useMemo(
    () => createVenueLandSummaries(aggregate),
    [aggregate],
  );
  return (
    <main className="venue-shell">
      <VenueCanvas
        recipes={recipes}
        reducedMotion={reducedMotion || fixedTimeMs !== undefined}
        {...(fixedTimeMs === undefined ? {} : { fixedTimeMs })}
      />
      <header className="venue-header">
        <div className="venue-brand">
          <p>MEMORY BREWERY</p>
          <h1>記憶醸造所</h1>
        </div>
        <div className="venue-counter" aria-live="polite">
          <strong>{recipes.length}</strong>
          <span>MEMORIES BREWING</span>
        </div>
      </header>
      <section className="venue-copy" aria-labelledby="venue-title">
        <p>LOCAL VENUE · SAME BROWSER</p>
        <h2 id="venue-title">
          {recipes.length === 0
            ? "記憶を、待っています"
            : "記憶が、静かに重なる"}
        </h2>
        <p>
          {recipes.length === 0
            ? "参加者の一杯が、ここへ重なっていきます。"
            : "それぞれの土地と動きが、会場の余韻として醸されています。"}
        </p>
        {latestRecipeId !== undefined && (
          <p className="venue-arrival" aria-live="polite">
            新しい記憶が重なりました。
          </p>
        )}
      </section>
      <aside className="venue-regions" aria-label="土地別の記憶数">
        <h2>土地の層</h2>
        {landEntries.length === 0 ? (
          <p>まだ記憶はありません</p>
        ) : (
          landEntries.map(({ displayName, count }) => (
            <div key={displayName}>
              <span aria-hidden="true" />
              <strong>{displayName}</strong>
              <small>{count}</small>
            </div>
          ))
        )}
      </aside>
      <div className="venue-controls">
        {confirmingClear ? (
          <>
            <p>会場の記憶をすべて消去しますか？</p>
            <button
              type="button"
              onClick={() => {
                sync.clear();
                setConfirmingClear(false);
              }}
            >
              消去する
            </button>
            <button type="button" onClick={() => setConfirmingClear(false)}>
              キャンセル
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmingClear(true)}>
            会場の記憶をクリア
          </button>
        )}
      </div>
    </main>
  );
}
