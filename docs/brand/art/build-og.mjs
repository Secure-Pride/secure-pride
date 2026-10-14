// build-og.mjs — renders the social preview card (public/og/securepride-og.png).
//
// Why a script: the card uses the site's statement, fonts, mark, and the
// obsidian shield artwork. Regenerate it whenever any of those change.
//
// Usage (from the repository root, after `npm run build`):
//   npm install --no-save playwright        # not a project dependency on purpose
//   npx playwright install chromium         # or set CHROMIUM to an installed one
//   node docs/brand/art/build-og.mjs
//
// Reads:  dist/index.html (the footer's medium-tier mark, verbatim),
//         src/assets/art/obsidian-shield.png, @fontsource font files.
// Writes: public/og/securepride-og.png (1200 × 630).
// Colours are the token values (site-tokens.css / upstream snapshot) because
// this page renders outside the site's stylesheet.

import { chromium } from 'playwright';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/* ─── Inputs ─────────────────────────────────────────────────────────── */

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, 'public', 'og');
const OUT_FILE = join(OUT_DIR, 'securepride-og.png');
const STATEMENT = 'Most security is built for people who can afford to fail.';

const TOKENS = {
  charcoal: '#1a191d', // --charcoal
  porcelain: '#f0ede8', // --porcelain (--sp-light-elevated)
  porcelainDim: '#c8c5c2', // --porcelain-dim, computed
  brassLight: '#e2b25b', // --sp-brass-light
  brassMid: '#8a5f1e', // --sp-brass-mid
  brassHighlight: '#f5d07a', // --sp-brass-highlight
};

const font = (pkg, file) => pathToFileURL(join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file)).href;
const artUrl = pathToFileURL(join(ROOT, 'src', 'assets', 'art', 'obsidian-shield.png')).href;

/** The footer mark from the built home page — the identity-kit SVG as shipped. */
function readMark() {
  const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');
  const match = html.match(/<svg class="site-footer__mark"[\s\S]*?<\/svg>/);
  if (!match) throw new Error('Footer mark not found in dist/index.html — run `npm run build` first.');
  return match[0].replace('width="128" height="128"', 'width="56" height="56"');
}

/* ─── Composition ────────────────────────────────────────────────────── */

function cardHtml(mark) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Statement; src: url(${font('shippori-mincho-b1', 'shippori-mincho-b1-latin-800-normal.woff2')}); font-weight: 800; }
@font-face { font-family: Record; src: url(${font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2')}); font-weight: 500; }
@font-face { font-family: Interface; src: url(${font('rajdhani', 'rajdhani-latin-600-normal.woff2')}); font-weight: 600; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body {
  position: relative;
  /* #121114 = --charcoal-deep; #08080a = the plate's spotlight (charcoal 30 % in black). */
  background: radial-gradient(ellipse 80% 90% at 0% 100%, #121114, transparent 70%), ${TOKENS.charcoal};
  color: ${TOKENS.porcelain};
}
.art {
  position: absolute; right: -40px; top: 40px; width: 640px; height: 520px;
  background: radial-gradient(ellipse 52% 56% at 50% 46%, #08080a 45%, transparent 100%);
}
.art img {
  width: 100%; height: 100%; object-fit: cover; object-position: 50% 0%;
  mix-blend-mode: lighten;
  /* Fade the bottom (shield cut by the frame) and the left (shoulder cut by the crop). */
  -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%), linear-gradient(to right, transparent 0%, black 22%);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}
.brand { position: absolute; left: 72px; top: 64px; display: flex; align-items: center; gap: 18px; }
.brand span { font: 600 22px/1 Interface; letter-spacing: 0.32em; text-transform: uppercase; }
h1 {
  position: absolute; left: 72px; top: 196px; width: 600px; margin: 0;
  font: 800 54px/1.12 Statement; letter-spacing: -0.005em;
}
.seam { position: absolute; left: 40px; bottom: 96px; width: 700px; height: 60px; }
.url { position: absolute; left: 72px; bottom: 56px; font: 500 18px/1 Record; color: ${TOKENS.porcelainDim}; letter-spacing: 0.04em; }
</style></head><body>
<div class="art"><img src="${artUrl}" alt=""></div>
<div class="brand">${mark}<span>Secure Pride</span></div>
<h1>${STATEMENT}</h1>
<svg class="seam" viewBox="0 0 1200 104" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="g" x1="78" y1="95" x2="1120" y2="20" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${TOKENS.brassMid}"/><stop offset=".38" stop-color="${TOKENS.brassLight}"/>
    <stop offset=".62" stop-color="${TOKENS.brassHighlight}"/><stop offset="1" stop-color="${TOKENS.brassMid}"/>
  </linearGradient></defs>
  <path d="M48 94C245 80 318 48 488 60C671 73 713 23 891 31C1001 36 1083 21 1152 9" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
</svg>
<p class="url">securepride.org</p>
</body></html>`;
}

/* ─── Render ─────────────────────────────────────────────────────────── */

// The card is loaded from a file:// URL: a page set with setContent() is
// about:blank, and Chromium refuses its file:// fonts and image silently.
const workDir = mkdtempSync(join(tmpdir(), 'sp-og-'));
const cardFile = join(workDir, 'card.html');
writeFileSync(cardFile, cardHtml(readMark()));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(cardFile).href, { waitUntil: 'load' });
  // Fail loudly on a silent fallback: every face and the artwork must load.
  const status = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].map((f) => `${f.family}:${f.status}`);
    const img = document.querySelector('.art img');
    return { faces, image: img.complete && img.naturalWidth > 0 };
  });
  const missing = status.faces.filter((f) => !f.endsWith(':loaded'));
  if (missing.length || !status.image) {
    throw new Error(`Card assets did not load: ${[...missing, status.image ? '' : 'artwork'].filter(Boolean).join(', ')}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({ path: OUT_FILE, type: 'png' });
  console.log(`Wrote ${OUT_FILE}`);
} finally {
  await browser.close();
  rmSync(workDir, { recursive: true, force: true });
}
