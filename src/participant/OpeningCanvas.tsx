import { useEffect, useRef } from "react";

import {
  browserAnimationDriver,
  type AnimationDriver,
} from "../application/opening/animation-driver";
import {
  normalizeCanvasSize,
  renderOpeningCanvas,
} from "../adapters/opening/canvas-renderer";
import type { BrewingRecipe } from "../domain/brewing/schemas";

/**
 * `visualTimeMs` is authoritative when not animating: ready renders 0 and
 * completed renders the explicit completion time. While animating, elapsed
 * time advances from the supplied starting time, including hidden-tab time.
 */
export function OpeningCanvas({
  recipe,
  visualTimeMs,
  animating,
  reducedMotion,
  animationDriver = browserAnimationDriver,
}: {
  recipe: BrewingRecipe;
  visualTimeMs: number;
  animating: boolean;
  reducedMotion: boolean;
  animationDriver?: AnimationDriver;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    const context = canvas.getContext("2d");
    if (context === null) return undefined;
    let size = normalizeCanvasSize(0, 0, window.devicePixelRatio);
    let requestId: number | undefined;
    const resumedAtMs = animationDriver.now();
    let disposed = false;

    const elapsedAt = (timeMs: number) =>
      animating
        ? visualTimeMs + Math.max(0, timeMs - resumedAtMs)
        : visualTimeMs;
    const drawAt = (timeMs: number) => {
      if (disposed) return;
      renderOpeningCanvas(
        context,
        recipe,
        size,
        elapsedAt(timeMs),
        reducedMotion,
      );
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      size = normalizeCanvasSize(
        bounds.width,
        bounds.height,
        window.devicePixelRatio,
      );
      canvas.width = Math.round(size.width * size.pixelRatio);
      canvas.height = Math.round(size.height * size.pixelRatio);
      drawAt(animationDriver.now());
    };
    const frame = (timeMs: number) => {
      drawAt(timeMs);
      if (animating && !document.hidden && !disposed) {
        requestId = animationDriver.requestFrame(frame);
      }
    };
    const visibility = () => {
      if (document.hidden) {
        if (requestId !== undefined) animationDriver.cancelFrame(requestId);
        requestId = undefined;
        return;
      }
      if (animating && requestId === undefined) {
        requestId = animationDriver.requestFrame(frame);
      }
    };

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(resize);
    observer?.observe(canvas);
    resize();
    document.addEventListener("visibilitychange", visibility);
    if (animating && !document.hidden) {
      requestId = animationDriver.requestFrame(frame);
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      if (requestId !== undefined) animationDriver.cancelFrame(requestId);
    };
  }, [animating, animationDriver, recipe, reducedMotion, visualTimeMs]);

  return (
    <canvas
      ref={canvasRef}
      className="opening-canvas"
      data-visual-time-ms={Math.round(visualTimeMs)}
      aria-label="醸造レシピから生まれた、動く記憶の作品"
      role="img"
    />
  );
}
