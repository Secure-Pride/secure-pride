#!/usr/bin/env node
/* Fails if a Tailwind color token in global.css's `@theme` block is not a
   var(--sp-*) reference into src/styles/tokens.css.

   This is what makes the Kintsugi palette drift structurally impossible
   instead of merely discouraged — mirrors the guard in secure-pride-design's
   component-factory build (factory/build.mjs). Tailwind 4 moved the theme
   from tailwind.config.ts into CSS; the rule is unchanged. If this fails,
   fix the value in global.css (or add the missing token to tokens.css) —
   never loosen this check to make a raw value pass. */

import { readFileSync } from 'node:fs';

const CSS_PATH = new URL('../src/styles/global.css', import.meta.url);
const src = readFileSync(CSS_PATH, 'utf8');

const theme = src.match(/@theme\s*\{([\s\S]*?)\n\}/);
if (!theme) {
  console.error('✗ check-color-tokens: could not locate the `@theme` block in src/styles/global.css');
  process.exit(1);
}

const colors = [...theme[1].matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)];
if (colors.length === 0) {
  console.error('✗ check-color-tokens: no --color-* tokens found in @theme — the guard would prove nothing');
  process.exit(1);
}

const violations = colors
  .filter(([, , value]) => !/^var\(--sp-[\w-]+\)$/.test(value.trim()))
  .map(([, name, value]) => `  ${name}: ${value.trim()}`);

if (violations.length) {
  console.error('✗ color token drift — @theme colors must be exactly var(--sp-*), not literal values:\n');
  console.error(violations.join('\n'));
  console.error('\nAdd/fix the value in src/styles/tokens.css and reference it with var(--sp-name) instead.');
  process.exit(1);
}

console.log(`✓ ${colors.length} @theme colors are all token references — no raw value drift`);
