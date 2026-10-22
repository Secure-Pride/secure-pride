/**
 * Gold seam geometry — the divider from the founder's editorial source
 * artwork (docs/brand/art/README.md), as pure functions.
 *
 * The seam is one absolute cubic Bézier path drawn in a 1200 × 104 box.
 * Pages stretch it to their width (preserveAspectRatio="none"), so anything
 * placed on it — the disclosure-timeline stations — is computed in the same
 * box and stretches with it.
 *
 * No DOM, no side effects. Used at build time by GoldSeam.astro.
 */

/* ─── Constants ──────────────────────────────────────────────────────── */

/** The divider path, verbatim from secure-pride-editorial-source.svg. */
export const SEAM_PATH =
  'M48 94C245 80 318 48 488 60C671 73 713 23 891 31C1001 36 1083 21 1152 9';

/** Drawing box for SEAM_PATH (the source translates it inside 2400 × 1000). */
export const SEAM_BOX = { width: 1200, height: 104 } as const;

/** Bisection steps when solving x(t) = x. 40 steps is far below 0.001 px. */
const SOLVE_STEPS = 40;

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface Point {
  x: number;
  y: number;
}

/** One cubic segment: start, two control points, end. */
export type Cubic = readonly [Point, Point, Point, Point];

/* ─── Parsing ────────────────────────────────────────────────────────── */

/**
 * Parse an absolute "M x y C … C …" path into cubic segments.
 * Throws on any other command: the seam is a fixed asset, so an unexpected
 * shape is a broken import, not input to tolerate.
 */
export function parseCubicPath(d: string): Cubic[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  if (tokens[0] !== 'M') throw new Error('Seam path must start with an absolute M.');

  const nums = (from: number, count: number): number[] => {
    const slice = tokens.slice(from, from + count).map(Number);
    if (slice.length !== count || slice.some(Number.isNaN)) {
      throw new Error(`Seam path: expected ${count} numbers at token ${from}.`);
    }
    return slice;
  };

  const [mx, my] = nums(1, 2);
  let cursor: Point = { x: mx, y: my };
  const segments: Cubic[] = [];

  for (let i = 3; i < tokens.length; ) {
    if (tokens[i] !== 'C') throw new Error(`Seam path: unsupported command "${tokens[i]}".`);
    i += 1;
    // Absolute C may repeat its six numbers without restating the letter.
    while (i < tokens.length && tokens[i] !== 'C') {
      const [x1, y1, x2, y2, x, y] = nums(i, 6);
      const end = { x, y };
      segments.push([cursor, { x: x1, y: y1 }, { x: x2, y: y2 }, end]);
      cursor = end;
      i += 6;
    }
  }
  if (segments.length === 0) throw new Error('Seam path has no cubic segments.');
  return segments;
}

/* ─── Evaluation ─────────────────────────────────────────────────────── */

/** Point on one cubic at parameter t ∈ [0, 1]. */
export function cubicAt([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + e * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + e * p3.y,
  };
}

/**
 * Point on the seam at horizontal position x. Assumes x increases along
 * each segment (true for the shipped seam; asserted in seam.test.ts).
 * x outside the path is clamped to the nearest end.
 */
export function pointAtX(segments: readonly Cubic[], x: number): Point {
  const first = segments[0][0];
  const last = segments[segments.length - 1][3];
  if (x <= first.x) return { ...first };
  if (x >= last.x) return { ...last };

  const segment = segments.find((s) => x >= s[0].x && x <= s[3].x) ?? segments[segments.length - 1];
  let lo = 0;
  let hi = 1;
  for (let step = 0; step < SOLVE_STEPS; step += 1) {
    const mid = (lo + hi) / 2;
    if (cubicAt(segment, mid).x < x) lo = mid;
    else hi = mid;
  }
  return cubicAt(segment, (lo + hi) / 2);
}

/**
 * Station points for a timeline of `count` equal columns laid under the
 * seam: each station sits on the seam at its column's centre.
 */
export function stationPoints(segments: readonly Cubic[], count: number, width = SEAM_BOX.width): Point[] {
  if (!Number.isInteger(count) || count < 1) return [];
  return Array.from({ length: count }, (_, i) => pointAtX(segments, ((i + 0.5) / count) * width));
}

/** Round to two decimals for compact SVG attributes. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
