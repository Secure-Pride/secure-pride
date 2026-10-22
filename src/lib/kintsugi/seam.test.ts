import { describe, expect, it } from 'vitest';
import { SEAM_BOX, SEAM_PATH, cubicAt, parseCubicPath, pointAtX, stationPoints } from './seam';

const segments = parseCubicPath(SEAM_PATH);

describe('parseCubicPath', () => {
  it('reads the shipped seam as three cubic segments', () => {
    expect(segments).toHaveLength(3);
    expect(segments[0][0]).toEqual({ x: 48, y: 94 });
    expect(segments[2][3]).toEqual({ x: 1152, y: 9 });
  });

  it('chains segments end to start', () => {
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i][0]).toEqual(segments[i - 1][3]);
    }
  });

  it('rejects commands the seam never uses', () => {
    expect(() => parseCubicPath('M0 0L10 10')).toThrow(/unsupported/);
    expect(() => parseCubicPath('C1 2 3 4 5 6')).toThrow(/start with an absolute M/);
    expect(() => parseCubicPath('M0 0C1 2 3')).toThrow(/expected 6 numbers/);
  });
});

describe('pointAtX', () => {
  it('is monotonic in x along every segment (the solver depends on it)', () => {
    for (const segment of segments) {
      let previous = -Infinity;
      for (let t = 0; t <= 1; t += 0.01) {
        const { x } = cubicAt(segment, t);
        expect(x).toBeGreaterThanOrEqual(previous);
        previous = x;
      }
    }
  });

  it('lands on the path within a hundredth of a unit', () => {
    for (const x of [60, 300, 488, 700, 891, 1100]) {
      const point = pointAtX(segments, x);
      expect(Math.abs(point.x - x)).toBeLessThan(0.01);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(SEAM_BOX.height);
    }
  });

  it('clamps outside the drawn span', () => {
    expect(pointAtX(segments, 0)).toEqual({ x: 48, y: 94 });
    expect(pointAtX(segments, 5000)).toEqual({ x: 1152, y: 9 });
  });
});

describe('stationPoints', () => {
  it('centres one station per column, left to right', () => {
    const points = stationPoints(segments, 6);
    expect(points.map((p) => Math.round(p.x))).toEqual([100, 300, 500, 700, 900, 1100]);
  });

  it('returns nothing for a non-positive or fractional count', () => {
    expect(stationPoints(segments, 0)).toEqual([]);
    expect(stationPoints(segments, 2.5)).toEqual([]);
  });
});
