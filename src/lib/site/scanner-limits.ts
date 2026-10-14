/**
 * What the public scanner's pattern engine catches and misses, as published
 * on /tools/. Each row names a class of input, never the payload itself.
 *
 * Source: the founder's red-team run against the live scanner (October 2026)
 * and a local re-run of functions/_lib/dlp/patterns.ts on 2026-10-14.
 * functions/_lib/dlp/published-limits.test.ts replays one payload per row:
 * when a miss starts being caught, that test fails and this list — and the
 * page — must be updated.
 */

export type LimitResult = 'caught' | 'missed';

export interface ScannerLimit {
  id: 'english-override' | 'translated' | 'homoglyph' | 'zero-width' | 'reworded-concealment';
  input: string;
  result: LimitResult;
}

export const SCANNER_LIMITS_TESTED = 'October 14, 2026';

export const SCANNER_LIMITS: readonly ScannerLimit[] = [
  { id: 'english-override', input: 'A plain-English instruction to ignore previous instructions', result: 'caught' },
  { id: 'translated', input: 'The same instruction translated into Spanish', result: 'missed' },
  { id: 'homoglyph', input: 'The same instruction with look-alike letters from another alphabet', result: 'missed' },
  { id: 'zero-width', input: 'The same instruction with invisible characters inside the words', result: 'missed' },
  { id: 'reworded-concealment', input: 'A reworded instruction to hide something from the user', result: 'missed' },
];

export const LIMIT_LABEL: Record<LimitResult, string> = {
  caught: 'Caught',
  missed: 'Missed',
};
