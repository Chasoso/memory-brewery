import {
  createOpeningDrawing,
  type OpeningDrawing,
} from "../../application/opening/visual-model";
import type { BrewingRecipe } from "../../domain/brewing/schemas";

export const openingCanvasPalette = {
  ink: "#202522",
  rice: "#f1eee4",
  water: "#d9e7e3",
  koji: "#d5c79c",
  ferment: "#678077",
  earth: "#8f6f63",
  night: "#17201e",
} as const;

export type CanvasSize = { width: number; height: number; pixelRatio: number };

export function normalizeCanvasSize(
  width: number,
  height: number,
  devicePixelRatio: number,
): CanvasSize {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;
  const pixelRatio = Math.min(
    2,
    Math.max(1, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1),
  );
  return { width: safeWidth, height: safeHeight, pixelRatio };
}

export function renderOpeningCanvas(
  context: CanvasRenderingContext2D,
  recipe: BrewingRecipe,
  size: CanvasSize,
  elapsedMs: number,
  reducedMotion: boolean,
): OpeningDrawing | undefined {
  if (size.width === 0 || size.height === 0) return undefined;
  const drawing = createOpeningDrawing(recipe, {
    width: size.width,
    height: size.height,
    elapsedMs,
    reducedMotion,
  });
  draw(context, drawing, size);
  return drawing;
}

function draw(
  context: CanvasRenderingContext2D,
  drawing: OpeningDrawing,
  size: CanvasSize,
): void {
  const background = openingCanvasPalette[drawing.backgroundToken];
  const accent = openingCanvasPalette[drawing.accentToken];
  context.save();
  context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
  context.fillStyle = withAlpha(background, drawing.fadeAlpha);
  context.fillRect(0, 0, size.width, size.height);

  drawWave(context, accent, drawing, size);
  for (const mark of drawing.marks) {
    context.beginPath();
    context.fillStyle = withAlpha(accent, mark.alpha);
    if (drawing.shapeFamily === "wave") {
      context.ellipse(
        mark.x,
        mark.y,
        mark.radius * 3,
        mark.radius,
        mark.phase,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else if (drawing.shapeFamily === "ripple") {
      context.lineWidth = Math.max(0.5, mark.radius * 0.7);
      context.strokeStyle = withAlpha(accent, mark.alpha);
      context.arc(mark.x, mark.y, mark.radius * 4, 0, Math.PI * 2);
      context.stroke();
    } else {
      context.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawWave(
  context: CanvasRenderingContext2D,
  accent: string,
  drawing: OpeningDrawing,
  size: CanvasSize,
): void {
  context.beginPath();
  const steps = 24;
  for (let index = 0; index <= steps; index += 1) {
    const x = (size.width * index) / steps;
    const y =
      drawing.waveY +
      Math.sin((index / steps) * Math.PI * 2) * drawing.waveAmplitude;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = withAlpha(accent, 0.35);
  context.lineWidth = 1;
  context.stroke();
}

function withAlpha(hex: string, alpha: number): string {
  const safeAlpha = Math.min(
    1,
    Math.max(0, Number.isFinite(alpha) ? alpha : 0),
  );
  return `${hex}${Math.round(safeAlpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
