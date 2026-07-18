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

export function OpeningCanvas({
  recipe,
  active,
  reducedMotion,
  animationDriver = browserAnimationDriver,
}: {
  recipe: BrewingRecipe;
  active: boolean;
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
    let origin = animationDriver.now();
    let disposed = false;

    const drawAt = (timeMs: number) => {
      if (disposed) return;
      renderOpeningCanvas(
        context,
        recipe,
        size,
        active ? timeMs - origin : 0,
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
      if (active && !document.hidden && !disposed)
        requestId = animationDriver.requestFrame(frame);
    };
    const visibility = () => {
      if (document.hidden) {
        if (requestId !== undefined) animationDriver.cancelFrame(requestId);
        requestId = undefined;
        return;
      }
      origin = animationDriver.now();
      if (active && requestId === undefined)
        requestId = animationDriver.requestFrame(frame);
    };

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(resize);
    observer?.observe(canvas);
    resize();
    document.addEventListener("visibilitychange", visibility);
    if (active && !document.hidden)
      requestId = animationDriver.requestFrame(frame);

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      if (requestId !== undefined) animationDriver.cancelFrame(requestId);
    };
  }, [active, animationDriver, recipe, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="opening-canvas"
      aria-label="醸造レシピから生まれた、動く記憶の作品"
      role="img"
    />
  );
}
