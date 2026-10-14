# Brand art — sources and provenance

Artwork used on securepride.org that is not part of the identity kit. The
identity-kit mark (`BrandMark.astro`) stays the logo; nothing here replaces it.

## Obsidian shield

| | |
| --- | --- |
| Site file | `src/assets/art/obsidian-shield.png` (1942 × 809 PNG) |
| sha256 | `5e557e0aced5647fed754e66ab79d9e1d36ac15ed8a29e225bbc15405cd8e6fd` |
| Arrived as | the `<image>` inside `secure-pride-editorial-source.svg` (2400 × 1000 artboard, sha256 `a78d1b40ee0b7c842dae43d12a2c5270f287b7dfaf0abd87f82adca35bcd522f`), supplied by the founder on 2026-10-14. The same PNG was attached separately; the two are byte-identical. |
| Provenance | The PNG carries a C2PA manifest: `c2pa.created` by `gpt-image` (OpenAI Media Service API), digital source type `trainedAlgorithmicMedia`, with a `c2pa.watermarked.unbound` action, dated 2026-08-16. In plain words: AI-generated, with an invisible watermark. |
| Where it is used | The plate on `/security/` (`SecurityPlate.astro`) and the social preview card (`public/og/securepride-og.png`). |

**What the site serves.** Astro re-encodes the PNG to AVIF, WebP, and a JPEG
fallback at build time. Re-encoding drops the C2PA manifest from the served
files (the watermark is in the pixels and may survive). The original PNG with
its manifest stays in the repository, and the plate's caption states the
provenance in words: *AI-generated artwork. The source file carries its C2PA
provenance record (OpenAI gpt-image, August 2026).*

**How it is placed.** Never with text on it. On the plate the image is cropped
to the shield (`aspect-ratio: 1.6`), blended with `mix-blend-mode: lighten` so
its black ground becomes the plate's charcoal, and faded at the bottom where
the frame cuts the shield.

## Gold seam divider

| | |
| --- | --- |
| Source | `docs/brand/art/gold-seam-divider.svg` — group `#gold-seam-divider` from the editorial source, verbatim, translate removed |
| sha256 | `acc14ac953ea9f59b6b20a3ebf8ccc4816676b178710a80568a073460694aa33` |
| Site component | `src/components/site/GoldSeam.astro`; geometry in `src/lib/kintsugi/seam.ts` |

The source gradient (`#7A5A1F → #D2A84B → #F5DE91 → #8F6926`, glint
`#F9EDBD` at 33 %) was drawn for a black ground. The site maps it to brass
tokens per surface in `src/styles/site-seam.css`:

| Stop | On charcoal | On porcelain |
| --- | --- | --- |
| 0 and 1 (deep) | `--sp-brass-mid` | `--sp-brass-mid` |
| 0.38 (warm) | `--sp-brass-light` | `--sp-brass` |
| 0.62 (light) | `--sp-brass-highlight` | `--sp-brass-light` |

On porcelain the ramp is one step darker so the lightest stretch does not
vanish into the glaze.

Uses: one seam under every page head (`PageShell.astro`), and the disclosure
timeline on `/security/`, where the six coordinated-disclosure stations sit on
the seam at equal column centres.

## Social preview card

`public/og/securepride-og.png` (1200 × 630) — the home statement, the footer
mark, the seam, and the shield. Rendered by `docs/brand/art/build-og.mjs`;
regenerate it when the statement, mark, or artwork changes. The script fails
if a font or the artwork does not load, rather than writing a card set in a
fallback face.

The previous card, `public/sp-og-preview.png`, is from the neon direction and
says "Audit toolkit" and "zero surveillance". Nothing references it any more;
it is left in place only so old shared links do not break. Delete it once
link previews have refreshed.

`.github/social-preview.png` is a third, older card (pink, "Identity-safe,
community-forward security", "PRODUCT"). GitHub shows whatever was uploaded in
the repository settings, not this file, so it was left alone; replacing it
means uploading a 1280 × 640 card in Settings → General → Social preview.
