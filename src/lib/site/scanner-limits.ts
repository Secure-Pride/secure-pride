/**
 * What the public scanner catches and misses, as published on /tools/. Each
 * row names a class of input, never the payload itself.
 *
 * Source: a replay of one payload per row against the shipped Rust engine
 * (functions/_lib/scanner/pkg, the WASM that serves /api/scan) on 2026-11-25.
 * The October 2026 rows described the retired TypeScript engine, which missed
 * the translated, look-alike-letter and invisible-character cases.
 * functions/_lib/scanner/published-limits.test.ts replays the same payloads
 * against the shipped WASM: when a result changes, that test fails and this
 * list, and the page, must be updated.
 */

export type LimitResult = 'caught' | 'missed';

export interface ScannerLimit {
  id: 'english-override' | 'translated' | 'homoglyph' | 'zero-width' | 'reworded-concealment';
  input: string;
  result: LimitResult;
}

export const SCANNER_LIMITS_TESTED = 'November 25, 2026';

export const SCANNER_LIMITS: readonly ScannerLimit[] = [
  { id: 'english-override', input: 'A plain-English instruction to ignore previous instructions', result: 'caught' },
  { id: 'translated', input: 'The same instruction translated into Spanish', result: 'caught' },
  { id: 'homoglyph', input: 'The same instruction with look-alike letters from another alphabet', result: 'caught' },
  { id: 'zero-width', input: 'The same instruction with invisible characters inside the words', result: 'caught' },
  { id: 'reworded-concealment', input: 'A reworded instruction to hide something from the user', result: 'missed' },
];

export const LIMIT_LABEL: Record<LimitResult, string> = {
  caught: 'Caught',
  missed: 'Missed',
};
