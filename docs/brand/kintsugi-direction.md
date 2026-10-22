# Kintsugi direction — public site

**Status**: Active (2026-10-09). Supersedes the visual layer of the 2026-10-02 homepage; keeps its copy and privacy boundaries.
**Decision record**: `docs/decisions/DECISION-008.md`

## Why this exists

The public site has swung three times in eight weeks:

| When | What shipped or was proposed | Got right | Got wrong |
|---|---|---|---|
| 2026-08-14 (#44) | Kintsugi palette over the original marketing site | Brass, fire opal, gem tones entered the system | Palette was a coat of paint over pricing, a simulated dashboard, and "Get protected" claims |
| 2026-09-09 (unshipped `fix/kintsugi-canonical-tokens`) | Canonical Claude Design tokens, `sp-*` classes, fire-opal primary | Real token source, drift guard, accessible contrast | Kept the overclaiming funnel (invented scan counts, a $200 tier), Orbitron all-caps, one long scroll, never used the brand mark |
| 2026-10-02 (#67, live) | People-first rewrite with explicit scanner limits | Honest copy, no simulated assurance, verified token snapshot | Muted brass on indigo, one long scroll with anchor jumps, a text-only wordmark, no interaction, leftover neon cyan in global focus and link styles |

The fix is not a fourth swing. Kintsugi already contains the reconciliation: a kintsugi repair does not hide the break, and #67's copy does not hide the tool's limits. **Both say the same thing: the seam stays visible.** This direction keeps the honest copy and gives it the material it was missing.

## Material palette

The palette follows Imari porcelain: underglaze blue, overglaze iron red and gold on white porcelain, with black outlines. It maps one-to-one onto the brief.

| Role | Token (composition layer) | Source | Use |
|---|---|---|---|
| Porcelain | `--porcelain` | `--sp-light-elevated` | Reading surface, the statement vessel |
| Porcelain glaze | `--porcelain-glaze` | `--sp-light-bg` | Raised tiles on porcelain |
| Charcoal (sumi) | `--charcoal` | new: `#1a191d` | Header, footer, home ground |
| Indigo (sometsuke) | `--indigo` | `--sp-indigo-hero` | Links and emphasis on porcelain |
| Fire opal (iron-red lacquer) | `--opal` | `--sp-opal` | Primary action fill, wet lacquer in the seam |
| Gold (kin) | `--sp-brass-*` | existing | The mended seam only |
| Gem | `--gem` per page | `--sp-gem-*`, `--sp-neon-red/blue` | One gem per page; identifies where you are |

Fire opal never sets text on porcelain (2.6:1). It fills buttons under charcoal text (5.75:1) and sets text on charcoal (5.75:1). Gem text uses a contrast-safe mix (`--gem-on-light`, `--gem-on-dark`); raw gem is for rules, markers, and shapes.

Charcoal is the only raw value not yet in the upstream catalog. Propose it to `design.securepride.org` before treating it as shared.

## Gem per page

The navigation is *yobitsugi*: shards from different vessels joined by one gold seam.

| Page | Gem | Why |
|---|---|---|
| Home | gold | The seam itself |
| Threat model | amber | Warning without alarm; previously unassigned (DECISION-011) |
| Tools | sapphire | Keeps cyan's existing "action/tool" meaning (DECISION-006) |
| The stakes | garnet | Cost and risk |
| Founder | tourmaline | Personal accountability; queer pink lineage |
| Contact | emerald | An open door |
| Privacy | amethyst | Boundary and processing |
| Security | lapis | Disclosure process |

## Type

| Voice | Face | Where |
|---|---|---|
| Statement | Shippori Mincho B1 800 (self-hosted, Latin subset) | The single home statement and page titles |
| Interface | Rajdhani 600, uppercase, tracked | Navigation, labels, buttons, vertical index |
| Reading | Inter 400/500 | Body copy |
| Record | JetBrains Mono | Dates, status, metadata |

Orbitron leaves the public pages. It read as cyberpunk, which is the swing this direction ends.

## Page hierarchy

Separate routes, one purpose each. No anchor-jumping long scroll.

```
/            The statement + the mending interaction + four doorways
/tools       What is available today, its boundaries, what is in development
/stakes      Who pays when a control fails
/founder     Who is accountable
/contact     How to reach a person
/privacy     Processing and logs        (footer)
/security    Vulnerability reporting    (footer)
/tools/scanner  The tool itself
```

Legacy anchors (`/#tools`, `/#stakes`, `/#about`, `/#get-involved`) forward to the new routes so old links keep working.

## The interaction

The home statement is set on a porcelain vessel that is already broken: four shards, slightly displaced, with dark hairline cracks.

- **Trace** (mouse or pen): passing over a crack lays down fire-opal lacquer, which cures to gold after a moment, as bengara urushi does under gold powder.
- **Tap** (touch): lacquer flows outward along the nearest crack from where you tapped.
- **Mend button** (keyboard, any input): mends every seam in sequence. It toggles to "Show the break".
- When every seam is gold, the shards settle and one line explains the metaphor.
- `prefers-reduced-motion`: same states, no transitions.
- No JavaScript: the vessel renders already mended, so the page is complete without it.
- Nothing is stored. A reload shows the break again.

The heading stays real text for assistive technology; the shards are decorative copies.

## Editorial grid (v1.1.0)

Four references from the founder (a magazine cover, a two-page temple-garden spread, a Korean exhibition poster, and an agency work index) share one discipline: a strict grid where every structural mark carries information. Borrowed conventions, each tied to something true:

| Convention | Source | On the site |
|---|---|---|
| Running head + folio over a hairline | Magazine spread | Publication line left, page position right (`01 / 04`; appendix pages show their own number) |
| Hairline-ruled info cells | Exhibition poster | Home facts sheet, the Tools scanner block, the security note |
| Giant route word cropped at the page edge | Agency index | Outlined route name in the page gem, in its own band under the title |
| Comparison grid | Poster info grid | The stakes as a real table: scenario × what happens × who pays × what the tool changes |
| `Title / descriptor` with a corner arrow | Agency index | Home doorways |
| Vertical type | Cover and spread | The tategaki route index (already in v1.0.0) |

Not borrowed: decorative CJK characters or seasonal motifs. The site is English-only and kintsugi is the one Japanese concept it names; set type in other scripts only when the content is in them.

## Seam, plate, and ledger (v1.2.0)

Folded in from the founder's 2026-10-14 assets (sources and provenance: `docs/brand/art/README.md`; decision: DECISION-009).

- **The gold seam** is the divider from the editorial source artwork, drawn with brass tokens. It appears once under every page head (`PageShell`) — the one mend between a page's claim and its body — and carries the disclosure timeline on `/security/`. It never animates. One seam per view; it is not a generic `<hr>`.
- **The plate** is a full-bleed charcoal band that holds artwork beside the numbers a reader needs. First use: `/security/`, obsidian shield beside *72 hours* and *90 days*. Artwork is cropped to its subject, blended `lighten` over a dark spotlight so its own black ground disappears, and never carries text.
- **Evidence grades** (borrowed from the founder's *MAESTRO in Practice* evidence ledger, where every headline number is graded by how it is sourced): a claim the site cannot fully stand behind gets a grade, not a softer sentence. Grades are words in square-cornered labels — *In the repository*, *Partly in place*, *Owner's statement*, *Not yet in place*; on `/tools/`, *Caught* / *Missed*. Colour and border style repeat the word; they never replace it. Every gradeable claim has a test that fails when reality changes.
- **Long documents** get an *On this page* index and numbered sections (index in the 56 px margin column), ordered by what the reader needs first.
- **Social card**: statement, mark, seam, shield — `public/og/securepride-og.png`, rendered by `docs/brand/art/build-og.mjs`.

The obsidian shield is heraldic with a carved heart. It is artwork, not the mark (the mark is the heraldic heart-lock shield — DECISION-010).

## Brand mark

Per `identity-kit/06_guidelines`:

- Header (36 px, charcoal): the heraldic mark (DECISION-010), base field removed so it sits on charcoal.
- Footer (128 px, clamped to 88–128 px, charcoal): the same vector, base field removed.
- On porcelain: `mono_light` only.
- Favicons: the existing user-supplied set in `public/favicons/`, unchanged.
- Never animate, glow, rotate, or overlay text on the mark. The kintsugi interaction never touches it.

**Resolved 2026-10-21 (DECISION-010):** the heraldic shield with the heart-lock is the canonical mark. `BrandMark.astro` draws it from the design system's heraldic vector; the rounded identity-kit shield is retired as the mark.

## Restraint rules

- One idea per view. Negative space is structure, not leftover room.
- Motion only where it carries meaning: the seam. Nothing else animates.
- No invented numbers, badges, or assurance language. Copy changes go through the founder.
- No glow, no rainbow fills, no all-caps display type outside interface labels.
