/**
 * The served Content-Security-Policy is built from the repo-root _headers
 * template plus hashes of the build's inline elements (scripts/csp.mjs).
 * These tests pin the hashing, the guard against unhashable inline code,
 * and the template's policy, so loosening it fails CI.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cspHash, renderHeaders, scanHtml } from '../../../scripts/csp.mjs';

const template = readFileSync(join(process.cwd(), '_headers'), 'utf8');

describe('CSP hashing', () => {
  it('hashes the exact element text as a sha256 source', () => {
    const text = 'customElements.define("x",class{})';
    const expected = createHash('sha256').update(text).digest('base64');
    expect(cspHash(text)).toBe(`'sha256-${expected}'`);
    expect(cspHash(`${text} `)).not.toBe(cspHash(text));
  });

  it('collects inline scripts and styles, skipping external scripts and JSON data', () => {
    const html = [
      '<script type="module" src="/_astro/a.js"></script>',
      '<script>window.a=1</script>',
      '<script type="application/ld+json">{"a":1}</script>',
      '<style>astro-island{display:contents}</style>',
    ].join('');
    const found = scanHtml(html);
    expect(found.scripts).toEqual(['window.a=1']);
    expect(found.styles).toEqual(['astro-island{display:contents}']);
    expect(found.blocked).toEqual([]);
  });

  it('flags inline code that no hash can allow', () => {
    expect(scanHtml('<div style="color:red"></div>').blocked).toContain('inline style="" attribute');
    expect(scanHtml('<button onclick="go()">x</button>').blocked).toContain('inline on*= event handler');
    expect(scanHtml('<a href="javascript:void(0)">x</a>').blocked).toContain('javascript: URL');
    // Mentioning style= inside a script body is not an attribute.
    expect(scanHtml('<script>el.setAttribute("style=", 1)</script>').blocked).toEqual([]);
  });

  it('follows the browser parser on edge cases a regex misses', () => {
    // Browsers end a script at "</script >"; the hash must cover exactly "a()".
    expect(scanHtml('<script>a()</script ><p>x</p>').scripts).toEqual(['a()']);
    // A ">" inside an attribute value does not end the tag.
    expect(scanHtml('<div title="a>b" onclick="x()"></div>').blocked).toContain('inline on*= event handler');
    // Inline code inside <template> still runs once cloned.
    expect(scanHtml('<template><b style="x"></b></template>').blocked).toContain('inline style="" attribute');
    expect(scanHtml('<a href="  JavaScript:go()">x</a>').blocked).toContain('javascript: URL');
  });
});

describe('_headers template', () => {
  const rendered = renderHeaders(template, { scripts: ['a()'], styles: ['b{}'] });
  const csp = rendered.match(/Content-Security-Policy: (.*)/)?.[1] ?? '';

  it('renders hashes into script-src and style-src and drops comments', () => {
    expect(csp).toContain(`script-src 'self' ${cspHash('a()')};`);
    expect(csp).toContain(`style-src 'self' ${cspHash('b{}')};`);
    expect(rendered).not.toMatch(/^#|\{\{/m);
  });

  it('keeps the policy strict', () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'", "frame-ancestors 'none'"]) {
      expect(csp).toContain(directive);
    }
  });

  it('starts the HSTS ramp at 30 days, apex only, until the decision record moves it', () => {
    expect(rendered).toMatch(/^  Strict-Transport-Security: max-age=2592000$/m);
  });

  it('still renders when the build has no inline elements', () => {
    const empty = renderHeaders(template, { scripts: [], styles: [] });
    expect(empty).toMatch(/script-src 'self'; style-src 'self';/);
  });
});
