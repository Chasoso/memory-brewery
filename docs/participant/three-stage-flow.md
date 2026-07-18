# Participant three-stage flow

The participant UI is a single React page with an explicit reducer. Its only permitted progression is `intro` → `initial` → `odori` → `naka` → `tome` → `result`; each transition is checked in the reducer rather than inferred by a component.

- 初添 stores only a normalized `GestureSummary`. SVG is used solely for input feedback because its bounded point list is easy to clear, inspect, and operate with Pointer Events; it is not the later Canvas artwork renderer.
- Pointer input retains at most 256 samples in component state. Its distance, speed, turns, intensity, and density are normalized to the existing domain schema. A labelled alternative gesture control enables keyboard completion without drawing.
- 踊り uses one effect-owned timeout: 10,000 ms by default. The component accepts an `odoriDurationMs` dependency for tests. `?test=1` composes a fixed seed, fixed clock, and 10 ms delay for E2E only.
- A session seed is generated once on entry and retained through back navigation. Reset creates a new seed, except when a test explicitly supplies one.
- The prototype intentionally begins with its first colour chip selected, so the React flow starts with the same `ferment` token. Progress still requires a valid gesture.
- `?test=1` is inert in ordinary builds. It only composes fixed E2E dependencies when Vite has built the client with `VITE_ENABLE_E2E_MODE=true`; Playwright sets that variable only for its local web server.
- Fixture loading and recipe completion occur in `src/application/participant/`; UI components do not import fixture JSON directly. Tone.js, final Canvas rendering, and venue publication remain later adapters.
