import { useEffect, useRef } from "react";
import {
  openingCanvasPalette,
  normalizeCanvasSize,
} from "../adapters/opening/canvas-renderer";
import {
  createVenueAggregate,
  venueDrawing,
} from "../application/venue/venue-scene";
import type { BrewingRecipe } from "../domain/brewing/schemas";

export function VenueCanvas({
  recipes,
  reducedMotion,
  fixedTimeMs,
}: {
  recipes: readonly BrewingRecipe[];
  reducedMotion: boolean;
  fixedTimeMs?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;
    const aggregate = createVenueAggregate(recipes);
    let frame = 0;
    let disposed = false;
    let size = normalizeCanvasSize(0, 0, window.devicePixelRatio);
    const draw = (time: number) => {
      if (disposed || size.width === 0 || size.height === 0) return;
      context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
      context.fillStyle = "#17201e";
      context.fillRect(0, 0, size.width, size.height);
      const gradient = context.createRadialGradient(
        size.width * 0.48,
        size.height * 0.46,
        10,
        size.width * 0.48,
        size.height * 0.46,
        Math.max(size.width, size.height) * 0.72,
      );
      gradient.addColorStop(0, "#35534a");
      gradient.addColorStop(1, "#17201e");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size.width, size.height);
      const drawingTime = fixedTimeMs ?? time;
      for (const mark of venueDrawing(
        aggregate,
        size.width,
        size.height,
        drawingTime,
        reducedMotion,
      )) {
        context.beginPath();
        context.fillStyle = `${openingCanvasPalette[mark.palette as keyof typeof openingCanvasPalette]}66`;
        context.arc(
          mark.x,
          mark.y,
          mark.radius + Math.sin(drawingTime / 900 + mark.phase) * 0.6,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
      context.strokeStyle = "rgba(217,231,227,.18)";
      for (let line = 0; line < 4; line += 1) {
        context.beginPath();
        for (let x = 0; x <= size.width; x += 16) {
          const y =
            size.height * (0.46 + line * 0.05) +
            Math.sin(x / 110 + drawingTime / 2400 + line) *
              (8 + aggregate.count);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      if (fixedTimeMs === undefined && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      size = normalizeCanvasSize(
        rect.width,
        rect.height,
        window.devicePixelRatio,
      );
      canvas.width = Math.round(size.width * size.pixelRatio);
      canvas.height = Math.round(size.height * size.pixelRatio);
      draw(performance.now());
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(resize);
    observer?.observe(canvas);
    resize();
    const visibility = () => {
      if (!document.hidden && frame === 0) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(frame);
    };
  }, [fixedTimeMs, recipes, reducedMotion]);
  return (
    <canvas
      ref={canvasRef}
      className="venue-canvas"
      role="img"
      aria-label="参加者の記憶から生まれた会場の集合作品"
    />
  );
}
