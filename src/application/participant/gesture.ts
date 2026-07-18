import {
  GestureSummarySchema,
  type GestureSummary,
} from "../../domain/brewing/schemas";

export type GesturePoint = Readonly<{ x: number; y: number; at: number }>;

const maxGestureSamples = 256;
const minimumGestureDistance = 8;

export function appendGesturePoint(
  points: readonly GesturePoint[],
  point: GesturePoint,
): GesturePoint[] {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.at)
  ) {
    return [...points];
  }
  if (points.length < maxGestureSamples) return [...points, point];

  const stride = Math.ceil(points.length / (maxGestureSamples - 1));
  return [...points.filter((_, index) => index % stride === 0), point].slice(
    -(maxGestureSamples - 1),
  );
}

export function summarizeGesture(
  points: readonly GesturePoint[],
): GestureSummary {
  if (points.length < 2) return { kind: "none" };

  let distance = 0;
  let directionChanges = 0;
  let previousAngle: number | undefined;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous === undefined || current === undefined) continue;
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const segmentDistance = Math.hypot(dx, dy);
    distance += segmentDistance;
    if (segmentDistance > 0.5) {
      const angle = Math.atan2(dy, dx);
      if (
        previousAngle !== undefined &&
        angleDifference(angle, previousAngle) > Math.PI / 5
      ) {
        directionChanges += 1;
      }
      previousAngle = angle;
    }
  }

  if (!Number.isFinite(distance) || distance < minimumGestureDistance) {
    return { kind: "none" };
  }
  const first = points[0];
  const last = points.at(-1);
  const durationMs =
    first === undefined || last === undefined
      ? 0
      : Math.max(1, last.at - first.at);
  const summary = {
    kind: "summary" as const,
    pointCount: points.length,
    averageSpeed: clamp((distance / durationMs) * 1000, 0, 100000),
    travelDistance: clamp(distance, 0, 1000000),
    directionChanges: Math.min(directionChanges, 10000),
    intensity: clamp(distance / 360, 0, 1),
    density: clamp(points.length / 48, 0, 1),
  };
  return GestureSummarySchema.parse(summary);
}

export const accessibleGesture: GestureSummary = {
  kind: "summary",
  pointCount: 12,
  averageSpeed: 110,
  travelDistance: 180,
  directionChanges: 3,
  intensity: 0.5,
  density: 0.42,
};

function angleDifference(first: number, second: number): number {
  const difference = Math.abs(first - second) % (2 * Math.PI);
  return difference > Math.PI ? 2 * Math.PI - difference : difference;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
