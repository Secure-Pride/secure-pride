# DECISION-008: Kintsugi porcelain — reconcile the honest site with a real kintsugi design

**Status**: Proposed (awaiting founder review of copy items below)
**Numbering**: filed as DECISION-007 on this branch; renumbered to 008 when #69 merged its own DECISION-007 (Wi-Fi Enterprise guide) to main.
**Date**: 2026-10-10
**Category**: UX / Accessibility / Brand
**Authority**: Tier 2 (interface change — documented per `docs/COPILOT-INSTRUCTIONS.md`). Two items are Tier 3 and are flagged, not changed.
**Decision maker**: Claude (autonomous), at the founder's direction

## Context

The founder asked for a balance between three swings in direction, citing vertigo:

1. **2026-08-14 (#44)**: kintsugi palette over the original marketing site.
2. **2026-09-09 (unshipped `fix/kintsugi-canonical-tokens`)**: canonical Claude Design tokens and `sp-*` classes, but it kept the overclaiming funnel (invented scan counts, a paid tier, "Get protected"), Orbitron all-caps, one long scroll, and never used the brand mark.
3. **2026-10-02 (#67, live)**: an honest, people-first rewrite with explicit scanner limits, but muted brass on indigo, one long scroll with anchor jumps, a text-only wordmark, and no interaction.

The founder prefers the kintsugi visual work, values the honesty of the live copy, and asked for: a real kintsugi design; one kintsugi interactive element; a single statement that calls out the problem; clear navigation across pages instead of one long scroll; charcoal and porcelain surfaces with indigo and fire-opal accents; gem tones to differentiate pages; and the brand mark and favicon actually used.

## Options considered

**A. Revive the September branch.** Rejected. It conflicts with #67 across every component #67 deleted, and it carries the simulated assurance #67 removed on purpose.

**B. Restyle the live single page in place.** Rejected. It keeps the long scroll and anchor jumps the founder named as a problem.

**C. Keep #67's copy and privacy boundaries; give them a kintsugi material system and separate routes.** Chosen.

## Decision

- Public pages use charcoal and porcelain surfaces, indigo and fire-opal accents, and one gem per route, following the Imari porcelain palette (underglaze blue, overglaze iron red and gold on white porcelain). Full spec: `docs/brand/kintsugi-direction.md`.
- The home page carries one statement, set on a porcelain vessel that starts broken and can be mended in gold by tracing, tapping, or a button.
- Content from the single page moves, near-verbatim, to `/tools`, `/stakes`, `/founder`, and `/contact`. Legacy anchors forward to them.
- Pages follow an editorial grid (v1.1.0): running head and folio, hairline-ruled cells, a giant cropped route word, the stakes as a comparison table, and slash-titled doorways. Spec: `kintsugi-direction.md`, "Editorial grid".
- The identity-kit mark appears in the header (Tier 3 file, 36 px) and footer (Tier 2 file, 128 px), per the kit's scaling rules.
- Astro no longer inlines scripts or stylesheets (`build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0`), keeping pages compatible with the CSP in `_headers`.

## Rationale

- **Values**: kintsugi leaves the repair visible; #67 leaves the tool's limits visible. The design now says what the copy already said. The caption under the vessel makes the link explicit.
- **Privacy**: no new third parties, requests, or storage. The new typeface (Shippori Mincho B1, OFL) is self-hosted through `@fontsource`, Latin subset only (32 KB woff2). The vessel stores nothing.
- **Accessibility**: all text measured in a browser at WCAG 2.1 AA or better on every page (lowest 4.96:1 after v1.1.0). The heading stays real text; the shard copies are `aria-hidden` and demoted from headings, so the page keeps one `h1`. The Mend button is keyboard reachable, toggles `aria-pressed`, and a polite live region announces the result. `prefers-reduced-motion` removes transitions. Without JavaScript the vessel renders already mended. Navigation targets are at least 44 px; phones get a four-cell nav instead of a wrapped list.
- **Trade-offs accepted**: the broken state draws hairline cracks through the statement. Cracks use a mid-tone so the ink stays the darkest thing on the vessel, and the real text is unaffected for assistive technology. Fire opal cannot set text on porcelain (2.6:1), so it is limited to button fills and charcoal surfaces.

## Implementation

- Geometry and pure helpers: `src/lib/kintsugi/fracture.ts` (unit-tested).
- Client behavior: `src/lib/kintsugi/vessel-controller.ts`.
- Components: `src/components/site/KintsugiVessel.astro`, `BrandMark.astro`; `Header.astro`, `Footer.astro`, `ToolTopBar.astro` updated.
- Site map: `src/lib/site/nav.ts` (unit-tested), read by header, footer, home doorways, and page indexes.
- Layout: `src/layouts/PageShell.astro`; `Layout.astro` gains `bodyClass`, a charcoal theme color, and loses an unused inline scroll-reveal script.
- Styles: `site-tokens.css` (composition tokens that reference `tokens.css`; charcoal is the one new raw value), `site.css`, `site-content.css`, `site-editorial.css`, `vessel.css`.
- Editorial components: `src/components/site/RunningHead.astro`; the stakes scenarios render as a `<table>` with explicit roles so phones can restack rows without losing table semantics. `community.css` and `Contact.astro` removed.
- `tokens.css` is untouched; `check-design-tokens.mjs` still passes against the upstream snapshot.

## Validation

- `npm run check`: token guards, Astro build (10 routes), `tsc --noEmit`.
- `npm test`: 89 tests across 8 files (16 new).
- Browser (headless Chromium, desktop and mobile): trace lays lacquer that cures to gold; Mend completes all 193 segments, settles the shards, updates the button and live region; Show the break resets; touch tap mends the nearest seam; reduced motion mends instantly; no-JS renders mended; legacy anchors forward; no console errors; contrast pass on every page.
- Built HTML: no inline scripts, styles, or `style` attributes on public pages. The scanner page keeps Astro's own `astro-island` style tag.

## Open items for the founder

1. **Statement copy (needs sign-off)**: "Most security is built for people who can afford to fail." New. Short section titles are also new: "Inspectable work.", "Write to a person.", "Other ways in."
2. **Security page** — *superseded by DECISION-009 (2026-10-14)*: the founder supplied the official policy; the template note and the 48-hour / 5-business-day conflict are gone. Was: a visible "This is a template security policy" note and a 48-hour acknowledgement, against `SECURITY.md`'s 5 business days.
3. **CSP is not served (Tier 2/3, unchanged)**: `_headers` sits at the repo root, outside `public/`, so Cloudflare Pages does not deploy it. The live site returns no Content-Security-Policy header. Moving it into `public/` needs its own review, since `Cross-Origin-Embedder-Policy: require-corp` and `form-action 'none'` may break existing behavior.
4. **Which shield is canonical**: the identity-kit vectors use a rounded heart-lock shield; the favicon raster uses a heraldic shield. The obsidian shield artwork (2026-10-14) is heraldic with a carved heart — used as artwork only, not as the mark. *Resolved by DECISION-010 (2026-10-21): the heraldic heart-lock shield is canonical.*
5. **Charcoal upstream**: propose `#1a191d` to `design.securepride.org` if it should become shared.
6. **Scanner tool**: still the indigo dark UI from #67. It now carries the mark and links back to `/tools/`; a porcelain pass is separate work.
7. **Unshipped September branch**: superseded by this decision. Its bundle and patch can be discarded.

## Rollback

Revert the branch's commits. No data, storage, or external service changes are involved.

## Outcome (updated later)

- Pending review and deploy.
