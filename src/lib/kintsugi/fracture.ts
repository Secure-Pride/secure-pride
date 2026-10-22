/**
 * Fracture geometry for the home-page kintsugi vessel.
 *
 * Single source of truth for where the statement is broken. Everything is in
 * normalized vessel space: x and y run 0–1 across the vessel's box, so the
 * same fracture stretches with whatever size the statement wraps to.
 *
 * Pure data and pure functions only — no DOM. Rendered server-side by
 * KintsugiVessel.astro (seam segments) and consumed client-side by
 * vessel-controller.ts (shard clip paths, pointer hit-testing).
 */

export type Point = readonly [number, number];
export type SeamId = 'a' | 'b' | 'c';
export type ShardId = 1 | 2 | 3 | 4;

export interface Seam {
  readonly id: SeamId;
  readonly points: readonly Point[];
}

export interface Shard {
  readonly id: ShardId;
  readonly polygon: readonly Point[];
  /** Seams on this shard's edge. The shard closes as these are mended. */
  readonly seams: readonly SeamId[];
  /** Broken-state displacement in CSS px: [dx, dy, rotationDeg]. */
  readonly drift: readonly [number, number, number];
}

/** One drawable piece of a seam, in a 0–1000 SVG viewBox. */
export interface Segment {
  readonly seam: SeamId;
  readonly index: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** Mended stroke width in px; varies like hand-laid lacquer. */
  readonly width: number;
  /** Gold shade 1–3, mapped to brass tokens in CSS. */
  readonly shade: 1 | 2 | 3;
}

/** Outer edges extend past the box so displaced shards never expose a border. */
const BLEED = 0.03;
const SEGMENTS_PER_UNIT = 90;

// ── Seams ───────────────────────────────────────────────────────────────────
// A runs top to bottom through the statement. C enters from the left and
// meets A at index 6. B leaves A at index 8 toward the right edge.
const A_JOIN_C = 6;
const A_JOIN_B = 8;

const SEAM_A: Seam = {
  id: 'a',
  points: [
    [0.612, 0], [0.598, 0.07], [0.622, 0.135], [0.603, 0.2], [0.586, 0.275],
    [0.601, 0.335], [0.572, 0.405], [0.583, 0.47], [0.561, 0.53], [0.548, 0.6],
    [0.566, 0.665], [0.531, 0.74], [0.544, 0.81], [0.512, 0.88], [0.524, 0.94],
    [0.505, 1],
  ],
};

const SEAM_C: Seam = {
  id: 'c',
  points: [
    [0, 0.335], [0.06, 0.352], [0.118, 0.338], [0.17, 0.37], [0.232, 0.358],
    [0.29, 0.392], [0.352, 0.381], [0.41, 0.414], [0.468, 0.396], [0.523, 0.417],
    SEAM_A.points[A_JOIN_C],
  ],
};

const SEAM_B: Seam = {
  id: 'b',
  points: [
    SEAM_A.points[A_JOIN_B], [0.612, 0.552], [0.664, 0.541], [0.712, 0.578],
    [0.768, 0.566], [0.82, 0.604], [0.871, 0.592], [0.925, 0.628], [0.97, 0.618],
    [1, 0.641],
  ],
};

export const SEAMS: readonly Seam[] = [SEAM_A, SEAM_B, SEAM_C];

// ── Shards ──────────────────────────────────────────────────────────────────
const a = SEAM_A.points;
const b = SEAM_B.points;
const c = SEAM_C.points;
const lo = -BLEED;
const hi = 1 + BLEED;
const rev = (pts: readonly Point[]): Point[] => [...pts].reverse();

export const SHARDS: readonly Shard[] = [
  {
    id: 1,
    seams: ['a', 'c'],
    drift: [-2, -1.5, -0.1],
    polygon: [[lo, lo], [a[0][0], lo], ...a.slice(0, A_JOIN_C + 1), ...rev(c.slice(0, -1)), [lo, c[0][1]]],
  },
  {
    id: 2,
    seams: ['a', 'c'],
    drift: [-1.5, 2, 0.08],
    polygon: [[lo, c[0][1]], ...c, ...a.slice(A_JOIN_C + 1), [a[a.length - 1][0], hi], [lo, hi]],
  },
  {
    id: 3,
    seams: ['a', 'b'],
    drift: [2, -1.5, 0.12],
    polygon: [[a[0][0], lo], [hi, lo], [hi, b[b.length - 1][1]], ...rev(b), ...rev(a.slice(0, A_JOIN_B))],
  },
  {
    id: 4,
    seams: ['a', 'b'],
    drift: [1.5, 2, -0.1],
    polygon: [...b, [hi, b[b.length - 1][1]], [hi, hi], [a[a.length - 1][0], hi], ...rev(a.slice(A_JOIN_B + 1))],
  },
];

// ── Pure helpers ────────────────────────────────────────────────────────────

/** Total length of a polyline in normalized units. */
export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

/** Point at distance `d` along a polyline (clamped to its ends). */
export function pointAt(points: readonly Point[], d: number): Point {
  let remaining = Math.max(0, d);
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (remaining <= len && len > 0) {
      const t = remaining / len;
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
    remaining -= len;
  }
  return points[points.length - 1];
}

/**
 * Deterministic 0–1 value that drifts slowly along a seam, like gold dust
 * settling unevenly on lacquer. Smooth on purpose: per-segment noise reads
 * as a dashed line, not a seam.
 */
function grain(seam: SeamId, index: number): number {
  const phase = seam.charCodeAt(0) * 1.7;
  const wave = Math.sin(index * 0.21 + phase) * 0.65 + Math.sin(index * 0.067 + phase * 2) * 0.35;
  return (wave + 1) / 2;
}

/** Split one seam into evenly spaced drawable segments (0–1000 viewBox). */
export function segmentSeam(seam: Seam): Segment[] {
  const length = polylineLength(seam.points);
  const count = Math.max(8, Math.round(length * SEGMENTS_PER_UNIT));
  const step = length / count;
  const segments: Segment[] = [];
  for (let i = 0; i < count; i += 1) {
    const [x1, y1] = pointAt(seam.points, i * step);
    const [x2, y2] = pointAt(seam.points, (i + 1) * step);
    const g = grain(seam.id, i);
    segments.push({
      seam: seam.id,
      index: i,
      x1: round(x1 * 1000), y1: round(y1 * 1000),
      x2: round(x2 * 1000), y2: round(y2 * 1000),
      width: round(2.2 + g * 1.4),
      shade: (1 + Math.min(2, Math.floor(g * 3))) as 1 | 2 | 3,
    });
  }
  return segments;
}

export function allSegments(): Segment[] {
  return SEAMS.flatMap(segmentSeam);
}

/** CSS polygon() for a shard, used as its clip-path. */
export function shardClipPath(shard: Shard): string {
  const pts = shard.polygon.map(([x, y]) => `${round(x * 100)}% ${round(y * 100)}%`);
  return `polygon(${pts.join(', ')})`;
}

/**
 * Order in which lacquer flows along a seam from a starting segment:
 * outward in both directions, nearest first.
 */
export function flowOrder(count: number, start: number): number[] {
  const from = Math.min(Math.max(0, start), count - 1);
  return Array.from({ length: count }, (_, i) => i).sort(
    (p, q) => Math.abs(p - from) - Math.abs(q - from) || p - q,
  );
}

/**
 * Distance in CSS px from a pointer to a segment's midpoint, given the
 * vessel's rendered size. Segments use the 0–1000 viewBox.
 */
export function pixelDistance(
  segment: Segment,
  pointer: { x: number; y: number },
  box: { width: number; height: number },
): number {
  const mx = ((segment.x1 + segment.x2) / 2000) * box.width;
  const my = ((segment.y1 + segment.y2) / 2000) * box.height;
  return Math.hypot(mx - pointer.x, my - pointer.y);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
