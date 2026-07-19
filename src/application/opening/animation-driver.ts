export type AnimationFrameCallback = (timeMs: number) => void;

/** Small boundary around animation time so renderers never derive time from frame count. */
export interface AnimationDriver {
  now(): number;
  requestFrame(callback: AnimationFrameCallback): number;
  cancelFrame(requestId: number): void;
}

export const browserAnimationDriver: AnimationDriver = {
  now: () => performance.now(),
  requestFrame: (callback) => window.requestAnimationFrame(callback),
  cancelFrame: (requestId) => window.cancelAnimationFrame(requestId),
};
