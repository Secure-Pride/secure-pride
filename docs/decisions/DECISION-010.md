# DECISION-010: The heraldic heart-lock shield is the canonical mark

**Status**: Accepted — the founder decided it directly.
**Date**: 2026-10-21
**Category**: Brand
**Decision ID**: DECISION-010
**Authority**: Tier 3 (brand identity), decided by the founder.
**Decision maker**: The founder ("the heraldic shield with heart lock is the brand logo, not the rounded one")

## Context

- DECISION-008 (item 4) and `docs/brand/kintsugi-direction.md` left one question open: the identity-kit vectors use a **rounded** heart-lock shield, while the favicon set uses a **heraldic** shield. Both were in use — `BrandMark.astro` drew the rounded one in the header and footer, and the favicons showed the heraldic one.
- The design system already holds a heraldic vector: secure-pride-design `project/favicons/favicon-simplified.svg` (Claude Design handoff `31decd2`) — heraldic shield, heart-lock with shackle and keyhole, prism arc. It is the same mark as `public/favicons/`.

## Decision

The heraldic shield with the heart-lock is the Secure Pride mark. The rounded identity-kit shield is retired from use as the mark.

## Implementation

- `src/components/site/BrandMark.astro` now draws the heraldic vector, copied verbatim from `favicon-simplified.svg` with only its square base field removed so it sits on charcoal (same treatment the rounded mark had). Props are unchanged, so the header, footer, tool bar and security plate callers did not move.
- One vector serves both `small` (32 px header) and `medium` (96 px footer); checked by rendering both on the built site at 1x and 3x.
- The obsidian shield artwork on `/security/` stays **artwork**, not the mark.

## Follow-ups

- `public/logo.svg` and the identity kit (`identity-kit/01_primary/brass_master.svg` and its scaled set) still draw the rounded shield. Regenerating them from the heraldic geometry is design-system work in secure-pride-design, not a site change.
- `kintsugi-direction.md` brand-mark section still names `small_64` / `medium_256`; those names now refer to sizes, not identity-kit files.
