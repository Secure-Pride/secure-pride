# DECISION-012: Serve the Content-Security-Policy, with build-time hashes

**Status**: Accepted — directed by the founder ("how do we get the content sp served").
**Date**: 2026-10-22
**Category**: Security
**Decision ID**: DECISION-012
**Authority**: Tier 2 (security headers), documented before merge. Closes DECISION-008 open item 3.

## Context

- `_headers` (CSP, HSTS, COOP/COEP/CORP, Permissions-Policy) sat at the repo root. Cloudflare Pages only reads `_headers` from the build output, so none of it was served; securepride.org returned only Cloudflare's defaults.
- DECISION-008 deferred serving it: `Cross-Origin-Embedder-Policy: require-corp` and `form-action 'none'` might break behaviour.
- Static pages were already CSP-clean (DECISION-007/008: no inline scripts or stylesheets). The three React tool pages were not: Astro's island hydration emits two inline `<script>`s and one inline `<style>`, which `script-src 'self'` / `style-src 'self'` would block.

## Options considered

**A. Copy `_headers` into `public/` unchanged.** Breaks the scanner, Wi-Fi guide and document engine (their islands never hydrate).

**B. Add `'unsafe-inline'`.** Works, and gives up most of what script-src protects against.

**C. Astro's `security.csp`.** Emits a per-page `<meta>` policy with hashes. A meta policy cannot carry `frame-ancestors`, and a header policy alongside it would still block the inline elements, so the header would need the hashes anyway.

**D. Hash at build time into the served header (chosen).** The root `_headers` becomes a template; `scripts/build-headers.mjs` (run by `npm run build`) hashes every inline script/style in `dist/` and writes `dist/_headers`. The build fails on anything a hash cannot allow (`style=""`, `on*=`, `javascript:` URLs).

## Decision

Option D. Policy unchanged from the authored one except: hashes added to `script-src` / `style-src`, `object-src 'none'` added. The stale `/assets/*` cache rules (no such path) are replaced by `/_astro/*` immutable caching for Astro's content-hashed files. `_redirects` stays out of the build: Pages does not support domain-level rules there, and www → apex is already a 301 at the zone.

## Review of the DECISION-008 concerns

Tested with `wrangler pages dev dist` (which applies `_headers` as production does) and headless Chromium, listening for `securitypolicyviolation` events:

- 12 routes, the home vessel (CSSOM styles and timers), a real `/api/scan` round-trip through the Pages Function, and the Wi-Fi guide intake: **0 violations, 0 errors** (one intentional 404).
- `form-action 'none'`: every form submits in JavaScript (`preventDefault`); none navigates.
- `require-corp`: every subresource is same-origin.
- Pixel diff against the unprotected build at 1280 and 390 px (8 routes, 3 scanner result states): 0.000%.

## Consequences

- A future inline `style=""` or event handler fails the build with the file name, rather than silently breaking in production.
- **HSTS ramps instead of jumping.** The authored value was one year with `includeSubDomains; preload`, which is hard to walk back: browsers keep it for the full max-age, and preload-list removal takes months. Step 1 ships `max-age=2592000` (30 days, apex only), the same as the zone already sends, so nothing changes for visitors. On 2026-10-22 only `securepride.org`, `www` and `design` resolved, all HTTPS-only.

  | Step | Value | Move on when |
  |---|---|---|
  | 1 (now) | `max-age=2592000` | Shipped; no HTTPS errors reported for 2 weeks |
  | 2 | `max-age=2592000; includeSubDomains` | Every DNS record in the Cloudflare zone is checked to serve valid HTTPS, or is not a web host |
  | 3 | `max-age=31536000; includeSubDomains` | Step 2 has run a month without breakage |
  | 4 | `max-age=63072000; includeSubDomains; preload` + submit at hstspreload.org | The founder decides the domain should be HTTPS-only for good (Tier 3: hard to reverse) |

  `csp-headers.test.ts` pins the current step, so moving to the next step is a deliberate edit to both the template and the test.
- The Docker/nginx image does not read `_headers`; it still serves without these headers.

## Verification

```bash
npm run build                                   # prints the hash counts
npx vitest run src/lib/site/csp-headers.test.ts
curl -sI https://securepride.org/ | grep -i content-security-policy
```

## Rollback

Revert the commit; Pages falls back to Cloudflare's default headers.
