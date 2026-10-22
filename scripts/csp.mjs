/* Content-Security-Policy hashing for the static build.

   Cloudflare Pages reads `_headers` from the build output, so the policy has
   to ship inside dist/. The pages are CSP-clean except Astro's island
   hydration, which emits a few inline <script>/<style> elements on the React
   tool pages. Rather than allow 'unsafe-inline', the build hashes exactly
   those elements and adds the hashes to the policy.

   Pure functions; scripts/build-headers.mjs does the file IO. Tested by
   src/lib/site/csp-headers.test.ts. */

import { createHash } from 'node:crypto';
import { parse } from 'parse5';

/** CSP source expression for an inline element's exact text content. */
export function cspHash(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href']);
const textOf = (node) => (node.childNodes ?? []).map((c) => c.value ?? '').join('');
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;

/** Inline scripts and styles in one HTML document, plus anything no hash can allow.
    Parsed with parse5 (the WHATWG algorithm browsers use), so end-tag
    variants such as `</script >` and attribute edge cases match browser
    behaviour rather than a regex's idea of HTML. */
export function scanHtml(html) {
  const scripts = [];
  const styles = [];
  const blocked = new Set();
  const visit = (node) => {
    if (node.tagName === 'script' && attr(node, 'src') === undefined) {
      // Data blocks are not executed, so CSP does not apply to them.
      if (!/^application\/(ld\+)?json$/i.test((attr(node, 'type') ?? '').trim())) scripts.push(textOf(node));
    }
    if (node.tagName === 'style') styles.push(textOf(node));
    for (const { name, value } of node.attrs ?? []) {
      if (name === 'style') blocked.add('inline style="" attribute');
      else if (name.startsWith('on')) blocked.add('inline on*= event handler');
      else if (URL_ATTRS.has(name) && /^\s*javascript:/i.test(value)) blocked.add('javascript: URL');
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content); // <template> contents
  };
  visit(parse(html));
  return { scripts, styles, blocked: [...blocked] };
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
