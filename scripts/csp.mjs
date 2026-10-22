/* Content-Security-Policy hashing for the static build.

   Cloudflare Pages reads `_headers` from the build output, so the policy has
   to ship inside dist/. The pages are CSP-clean except Astro's island
   hydration, which emits a few inline <script>/<style> elements on the React
   tool pages. Rather than allow 'unsafe-inline', the build hashes exactly
   those elements and adds the hashes to the policy.

   Pure functions; scripts/build-headers.mjs does the file IO. Tested by
   src/lib/site/csp-headers.test.ts. */

import { createHash } from 'node:crypto';

/** CSP source expression for an inline element's exact text content. */
export function cspHash(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/** Inline scripts and styles in one HTML document, plus anything no hash can allow. */
export function scanHtml(html) {
  const scripts = [];
  const styles = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    // Data blocks are not executed, so CSP does not apply to them.
    if (/\btype\s*=\s*["']?application\/(ld\+)?json/i.test(attrs)) continue;
    scripts.push(m[2]);
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) styles.push(m[1]);
  // Strip element bodies so text that merely mentions style= is not flagged.
  const tags = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const blocked = [];
  if (/<[a-z][^>]*\sstyle\s*=/i.test(tags)) blocked.push('inline style="" attribute');
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(tags)) blocked.push('inline on*= event handler');
  if (/\bhref\s*=\s*["']?\s*javascript:/i.test(tags)) blocked.push('javascript: URL');
  return { scripts, styles, blocked };
}

/** Fill the {{SCRIPT_HASHES}} / {{STYLE_HASHES}} placeholders in the template. */
export function renderHeaders(template, { scripts, styles }) {
  for (const key of ['{{SCRIPT_HASHES}}', '{{STYLE_HASHES}}']) {
    if (!template.includes(key)) throw new Error(`_headers template is missing ${key}`);
  }
  const list = (texts) => [...new Set(texts.map(cspHash))].sort().join(' ');
  return template
    .replace('{{SCRIPT_HASHES}}', list(scripts))
    .replace('{{STYLE_HASHES}}', list(styles))
    .replace(/ +;/g, ';')
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
}
