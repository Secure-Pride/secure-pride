import { describe, expect, it } from 'vitest';
import {
  SEAMS,
  SHARDS,
  allSegments,
  flowOrder,
  pixelDistance,
  pointAt,
  polylineLength,
  segmentSeam,
  shardClipPath,
  type Point,
  type SeamId,
} from './fracture';

const seam = (id: SeamId) => SEAMS.find((s) => s.id === id)!;
const same = (p: Point, q: Point) => p[0] === q[0] && p[1] === q[1];
const inUnit = ([x, y]: Point) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

describe('fracture geometry', () => {
  it('keeps every seam point inside the vessel', () => {
    for (const s of SEAMS) expect(s.points.every(inUnit)).toBe(true);
  });

  it('joins C and B onto A so the cracks form one connected break', () => {
    const a = seam('a').points;
    expect(a.some((p) => same(p, seam('c').points.at(-1)!))).toBe(true);
    expect(a.some((p) => same(p, seam('b').points[0]))).toBe(true);
  });

  it('borders each shard with the seams it claims', () => {
    for (const shard of SHARDS) {
      for (const id of shard.seams) {
        const shared = seam(id).points.filter((p) => shard.polygon.some((q) => same(p, q)));
        expect(shared.length, `shard ${shard.id} / seam ${id}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('splits every seam point between at least two shards', () => {
    for (const s of SEAMS) {
      for (const p of s.points) {
        if (p[0] === 0 || p[0] === 1 || p[1] === 0 || p[1] === 1) continue; // edge exits
        const owners = SHARDS.filter((shard) => shard.polygon.some((q) => same(p, q)));
        expect(owners.length, `seam ${s.id} point ${p}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('keeps broken-state drift at hairline scale', () => {
    for (const shard of SHARDS) {
      const [dx, dy, rot] = shard.drift;
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(3);
      expect(Math.abs(rot)).toBeLessThanOrEqual(0.2);
    }
  });
});

describe('segments', () => {
  it('produces contiguous segments that trace the whole seam', () => {
    for (const s of SEAMS) {
      const segs = segmentSeam(s);
      for (let i = 1; i < segs.length; i += 1) {
        expect(segs[i].x1).toBeCloseTo(segs[i - 1].x2, 1);
        expect(segs[i].y1).toBeCloseTo(segs[i - 1].y2, 1);
      }
      expect(segs[0].x1).toBeCloseTo(s.points[0][0] * 1000, 1);
      expect(segs.at(-1)!.x2).toBeCloseTo(s.points.at(-1)![0] * 1000, 1);
    }
  });

  it('keeps lacquer width and gold shade within the designed range', () => {
    for (const seg of allSegments()) {
      expect(seg.width).toBeGreaterThanOrEqual(2.2);
      expect(seg.width).toBeLessThanOrEqual(3.6);
      expect([1, 2, 3]).toContain(seg.shade);
    }
  });

  it('varies shade gradually, so the seam never reads as dashes', () => {
    for (const s of SEAMS) {
      const shades = segmentSeam(s).map((seg) => seg.shade);
      const jumps = shades.slice(1).filter((v, i) => Math.abs(v - shades[i]) > 1);
      expect(jumps).toHaveLength(0);
    }
  });

  it('is deterministic between server render and client', () => {
    expect(allSegments()).toEqual(allSegments());
  });
});

describe('helpers', () => {
  it('measures and walks a polyline', () => {
    const line: Point[] = [[0, 0], [3, 4]];
    expect(polylineLength(line)).toBe(5);
    expect(pointAt(line, 2.5)).toEqual([1.5, 2]);
    expect(pointAt(line, 99)).toEqual([3, 4]);
    expect(pointAt(line, -1)).toEqual([0, 0]);
  });

  it('flows lacquer outward from the start, nearest first', () => {
    expect(flowOrder(5, 2)).toEqual([2, 1, 3, 0, 4]);
    expect(flowOrder(4, 99)).toEqual([3, 2, 1, 0]);
    expect([...flowOrder(7, 0)].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('measures pointer distance in rendered pixels', () => {
    const seg = { seam: 'a' as const, index: 0, x1: 500, y1: 500, x2: 500, y2: 500, width: 3, shade: 1 as const };
    expect(pixelDistance(seg, { x: 100, y: 50 }, { width: 200, height: 100 })).toBe(0);
    expect(pixelDistance(seg, { x: 103, y: 54 }, { width: 200, height: 100 })).toBe(5);
  });

  it('formats a shard as a CSS polygon', () => {
    const css = shardClipPath(SHARDS[0]);
    expect(css.startsWith('polygon(')).toBe(true);
    expect(css).toContain('-3% -3%');
  });
});
