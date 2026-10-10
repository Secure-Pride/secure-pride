# Brand Assets

Secure Pride brand voice, design system, and documentation templates.

## Contents

| File | Description | Format |
|------|-------------|--------|
| `brand-voice-guide-v1.pdf` | Brand voice principles, website copy, terminology | PDF (print-ready) |
| `brand-voice-guide-v1.docx` | Same content, editable | Word |
| `design-system-v2.jsx` | Living design system artifact — colors, typography, components | React |

## Brand Voice (Summary)

Five principles govern all Secure Pride communications:

1. **Calm confidence** — competence without alarm
2. **Culturally competent** — we speak as community members, not outsiders
3. **Approachable professional** — expertise without jargon
4. **Protection-first framing** — lead with what we protect, not what we prevent
5. **Honest about limitations** — we say what we do and what we don't

## Design System

- **Public site direction**: [`kintsugi-direction.md`](kintsugi-direction.md) — charcoal and porcelain surfaces, indigo and fire-opal accents, one gem per page, the mending interaction, and mark usage. Decision record: `docs/decisions/DECISION-008.md`.
- **Shared tokens**: `src/styles/tokens.css`, validated against the dated `design.securepride.org` snapshot in `upstream/` by `scripts/check-design-tokens.mjs`. Site-only composition tokens live in `src/styles/site-tokens.css` and reference the shared ones.
- **Typography (public site)**: Shippori Mincho B1 (statement), Rajdhani (interface), Inter (reading), JetBrains Mono (record). Orbitron remains only in the scanner tool UI.
- **Primary mark**: heart-lock shield, from the Claude Design identity kit (`identity-kit/`), inlined by `src/components/site/BrandMark.astro` at the correct tier per size.
- **Print surface**: White backgrounds with teal/purple accents only

## Document Engine

The document engine (`docs/securepride-document-engine.jsx`) generates branded PDF output from structured content. Four templates: Brand Guide, Report/Proposal, Technical Documentation, One-Pager.

Supports Markdown with Secure Pride extensions:

- `[Label]: Copy text` → branded copy blocks
- `✗ Don't | ✓ Do` → comparison cards
- `> Quote` → teal-bordered blockquotes

## Licensing

- Code: Apache 2.0
- Documentation: CC BY 4.0

## Public-site alignment (October 2026)

The homepage uses the live catalog’s brass/indigo composition, Rajdhani
headings, and Inter prose. Four brass roles now match the live CSS source.
The dated source snapshot and SHA-256 digest live in `upstream/`.
`npm run check:tokens` verifies shared values without network access.
Upstream changes require a reviewed snapshot update; this check does not
claim to detect changes on the remote site automatically.

The upstream stylesheet retains Orbitron and cyan action aliases, while
the catalog's public composition foregrounds Rajdhani and brass. The
homepage follows the catalog; other surfaces retain their semantic roles.
Fonts remain self-hosted in the application.
