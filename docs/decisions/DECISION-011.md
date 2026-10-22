# DECISION-011: Make the threat model the centre of the public site

**Status**: Accepted — directed by the founder.
**Date**: 2026-10-22
**Category**: Architecture · Content · Privacy
**Decision ID**: DECISION-011
**Authority**: Tier 2 (UX, content and information architecture), documented before merge. Direction from the founder: "fully develop this to be a center feature".
**Decision maker**: The founder

## Context

- On 2026-10-21 a working threat model was drafted for Secure Pride: *disclosure, coercion, and continuity of care* (now `docs/threat-model/`). It holds twelve synthetic scenarios, three adversarial walkthroughs, a route-level integration contract, and a structural validator. The draft said explicitly that it implied no site change or publication.
- The founder directed that it ship on securepride.org as a central feature, not a side page.
- The site's existing ethos (DECISION-006, DECISION-009) is graded honesty: say what is in place, what is partly in place, and what is not. Publishing a model whose controls are all *proposed* has to keep that.
- One finding in the draft was about this site: the privacy page appeared to be a template. Rechecked on 2026-10-22, the live page and its source are a specific processing notice (updated 2026-10-02). The finding no longer holds and the documents now say so.

## Options considered

**A. Publish the documents as-is (Markdown in the repo, link from the footer).** Cheapest. Does not make the model the shared basis for tools, and leaves the stale privacy finding public.

**B. A single long `/threat-model/` page.** Readable, but scenarios cannot be linked from tools, and the corpus is not reusable.

**C. A first-class section rendered from one reviewed corpus (chosen).** `/threat-model/`, a page per scenario, the walkthroughs, and a versioned `corpus.json`, all from `src/data/threat-model/corpus.json`; tools link to the scenarios that bound them; structural checks and the SP-02 boundary test run in CI.

## Decision

Option C.

- **Navigation**: *Threat model* is primary route 01 with the amber gem (previously unassigned). Other routes renumber; pages look routes up by href (`routeFor`) so order can change without editing pages. On phones the nav becomes five columns; on the home page the threat-model doorway spans the first row.
- **Home**: a full-width *At the centre* cell leads the ledger, above the scanner.
- **Routes**: `/threat-model/`, `/threat-model/scenarios/sp-01/` … `sp-12/`, `/threat-model/walkthroughs/`, `/threat-model/corpus.json`. All static; no page asks anything, stores anything, or runs client script.
- **Honesty kept on the page**: a status strip (working draft, all synthetic, all controls proposed, no community review); a release-requirements table graded *Met / Partly met / Open* with the controls ledger's chips (none met); a list of claims not made; and an explicit "do not send real incidents" because no safe intake exists (SP-11).
- **Tool link (first bounded implementation, SP-02)**: the scanner's no-match guidance moves into `scanner-results.ts` as `NO_MATCH_GUIDANCE`, now says a name-free story can still identify someone, and links SP-02 and SP-11. `sp02-scanner-boundary.test.ts` replays the corpus fixture against the pattern engine (it is missed, by design) and asserts the wording never clears sharing.
- **Corpus**: schema/corpus v0.2 adds `corpus_version`, `updated`, `canonical_url`, `source_repository` and `license`. Scenario content is unchanged from v0.1.
- **Licence**: the corpus and documents are original text under the repository's Apache-2.0 licence; sources are linked, not republished.

## Consequences

- Every future change to a tool's behaviour should name the scenarios it affects. This is stated on the page; it is not yet enforced in the PR template.
- SP-01's reminder workflow is not built — Secure Pride sends no reminders. It stays a scenario until a service integration exists.
- Publishing synthetic scenarios is not validation. The next milestone remains paid, consent-based community and practitioner review, which must not require disclosure of HIV status, identity, or real cases.

## Verification

```bash
npm run check   # tokens + astro build (25 pages) + tsc
npm test        # includes corpus.test.ts and sp02-scanner-boundary.test.ts
```

Rendered and screenshotted at 1440 px and 390 px (home, `/threat-model/`, SP-02, walkthroughs, `/tools/`): no console errors, no horizontal overflow.

## Rollback

Revert the merge commit. The scanner's previous no-match wording returns with it; no data or settings change.

## Outcome (updated later)

- _Pending community review._
