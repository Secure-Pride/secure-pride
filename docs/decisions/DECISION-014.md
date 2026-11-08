# DECISION-014: Scanner page uses the porcelain and charcoal site

**Status**: Accepted — directed by the founder ("translate the scanner page into the new porcelain and charcoal design language").
**Date**: 2026-11-08
**Category**: UX | Accessibility
**Decision ID**: DECISION-014
**Authority**: Tier 2. Extends DECISION-008 to `/tools/scanner/`, which the kintsugi direction already listed as its own route but left on `ToolLayout`.

## Context

The landing page and the public routes use porcelain for reading, charcoal for the header, footer, and home ground, fire opal for the primary action, and one gem per section of the site. The scanner was a separate dark tool chrome (brass on near-black, its own top bar, no site header or footer).

## Options

**A. Restyle the isolated tool chrome with porcelain colors.** Still a second site: no running head, no shared navigation, no footer.

**B. Put the scanner in `PageShell` and use the existing surfaces.** Porcelain page, sapphire gem (the Tools route), charcoal plate for the processing warning and for a withhold result. Copy, limits, and control names stay. **Chosen.**

## Decision

`/tools/scanner/` uses `PageShell` with the Tools route and canonical path `/tools/scanner/`. The React tool drops the dark utility classes. Fire opal fills "Run text check" with charcoal text. Charcoal is the boundary, not the whole page.

## What did not change

The words of the check, the 50,000-character limit, the invented example, the result headings, and the rule that a no-match is not clearance.

## Verification

Load `/tools/scanner/` on the Pages dev server. Confirm the porcelain page head, the charcoal "Before you submit" plate, a withhold result on charcoal, and a review result for an email on porcelain. Check the same flow at a narrow viewport.
