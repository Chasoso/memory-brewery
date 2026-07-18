import { createSeededRandom } from "../../domain/brewing/random";
import type { BrewingRecipe, VisualRecipe } from "../../domain/brewing/schemas";

export const openingRendererVersion = "canvas-2d-v1";

const maxRenderableElements = 120;

export type OpeningRenderConfiguration = {
  width: number;
  height: number;
  elapsedMs: number;
  reducedMotion: boolean;
};

export type OpeningMark = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
};

export type OpeningDrawing = {
  backgroundToken: VisualRecipe["paletteToken"];
  accentToken: VisualRecipe["paletteToken"];
  shapeFamily: VisualRecipe["shapeFamily"];
  waveY: number;
  waveAmplitude: number;
  fadeAlpha: number;
  marks: readonly OpeningMark[];
};

type ParticleSeed = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  drift: number;
};

/**
 * Creates the stable, recipe-owned scene parameters once. The FNV-1a +
 * Mulberry32 generator is the already versioned recipe generator; this suffix
 * only creates a distinct deterministic stream for the opening renderer.
 */
export function createOpeningScene(
  recipe: BrewingRecipe,
): readonly ParticleSeed[] {
  const random = createSeededRandom(
    `${recipe.seed}|${recipe.recipeId}|${openingRendererVersion}`,
  );
  const count = Math.min(
    maxRenderableElements,
    Math.max(
      10,
      Math.round(
        recipe.visual.particleCount * (0.4 + recipe.visual.density * 0.6),
      ),
    ),
  );

  return Array.from({ length: count }, () => ({
    x: random.next(),
    y: random.next(),
    radius: 0.35 + random.next() * 1.65,
    phase: random.next() * Math.PI * 2,
    drift: random.next() * 2 - 1,
  }));
}

export function createOpeningDrawing(
  recipe: BrewingRecipe,
  configuration: OpeningRenderConfiguration,
): OpeningDrawing {
  const width = finiteSize(configuration.width);
  const height = finiteSize(configuration.height);
  const visual = recipe.visual;
  const durationMs = visual.durationSeconds * 1000;
  const progress =
    positiveModulo(configuration.elapsedMs, durationMs) / durationMs;
  const motionScale = configuration.reducedMotion ? 0.12 : 1;
  const direction = (visual.flowDirectionDegrees * Math.PI) / 180;
  const flowX = Math.cos(direction);
  const flowY = Math.sin(direction);
  const speed = (0.15 + visual.particleSpeed * 0.85) * motionScale;
  const turbulence = visual.turbulence * motionScale;
  const scene = createOpeningScene(recipe);
  const marks = scene.map((particle) => {
    const phase = particle.phase + progress * Math.PI * 2;
    const motion = motionFor(visual.motionCharacter, progress, particle.drift);
    const x = wrap(
      particle.x * width +
        flowX * width * speed * motion +
        Math.sin(phase) * width * 0.08 * turbulence,
      width,
    );
    const y = wrap(
      particle.y * height +
        flowY * height * speed * motion +
        Math.cos(phase * 1.2) * height * 0.08 * turbulence,
      height,
    );
    return {
      x,
      y,
      radius: Math.max(0.5, particle.radius * (1 + visual.density * 1.8)),
      alpha: clamp(
        0.12 + visual.density * 0.42 + Math.sin(phase) * 0.08,
        0.05,
        0.72,
      ),
      phase,
    };
  });

  return {
    backgroundToken: visual.paletteToken,
    accentToken: accentFor(visual.paletteToken),
    shapeFamily: visual.shapeFamily,
    waveY:
      height * (0.48 + Math.sin(progress * Math.PI * 2) * 0.04 * motionScale),
    waveAmplitude:
      height *
      (0.025 + visual.waveAmplitude * 0.11) *
      (configuration.reducedMotion ? 0.3 : 1),
    fadeAlpha: clamp(0.05 + (1 - visual.fade) * 0.22, 0.05, 0.27),
    marks,
  };
}

function motionFor(
  character: VisualRecipe["motionCharacter"],
  progress: number,
  drift: number,
): number {
  switch (character) {
    case "converge":
      return (0.5 - progress) * drift;
    case "drift":
      return progress * drift;
    case "float":
      return Math.sin(progress * Math.PI * 2) * drift;
    case "slow-ripple":
      return Math.sin(progress * Math.PI * 2) * 0.5 + drift * 0.2;
  }
}

function accentFor(
  token: VisualRecipe["paletteToken"],
): VisualRecipe["paletteToken"] {
  const accents: Record<
    VisualRecipe["paletteToken"],
    VisualRecipe["paletteToken"]
  > = {
    ink: "rice",
    rice: "ferment",
    water: "koji",
    koji: "earth",
    ferment: "water",
    earth: "koji",
    night: "water",
  };
  return accents[token];
}

function finiteSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function positiveModulo(value: number, modulus: number): number {
  if (!Number.isFinite(value) || modulus <= 0) return 0;
  return ((Math.max(0, value) % modulus) + modulus) % modulus;
}

function wrap(value: number, size: number): number {
  if (size <= 0) return 0;
  return ((value % size) + size) % size;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
