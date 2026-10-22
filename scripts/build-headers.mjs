#!/usr/bin/env node
/* Post-build: write dist/_headers from the repo-root _headers template, with
   a hash for every inline script and style the build emitted. Fails the
   build if a page contains something a hash cannot allow (style="" or an
   on*= handler), so the served policy can never silently break a page.
   Run by `npm run build`. Logic: scripts/csp.mjs. */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHeaders, scanHtml } from './csp.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const scripts = [];
const styles = [];
const problems = [];
const pages = htmlFiles(DIST);
for (const file of pages) {
  const found = scanHtml(readFileSync(file, 'utf8'));
  scripts.push(...found.scripts);
  styles.push(...found.styles);
  for (const what of found.blocked) problems.push(`  ${relative(DIST, file)}: ${what}`);
}

if (problems.length) {
  console.error('✗ build-headers: these cannot be allowed by a CSP hash — move them to a file or CSSOM:\n');
  console.error(problems.join('\n'));
  process.exit(1);
}

const out = renderHeaders(readFileSync(join(ROOT, '_headers'), 'utf8'), { scripts, styles });
writeFileSync(join(DIST, '_headers'), out);
console.log(
  `✓ dist/_headers: CSP for ${pages.length} pages, ${new Set(scripts).size} inline script hash(es), ${new Set(styles).size} inline style hash(es)`,
);
