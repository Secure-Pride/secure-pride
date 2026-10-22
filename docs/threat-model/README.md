# SecurePride: disclosure, coercion, and continuity of care

Working threat model v0.1 — 21 October 2026 · published on the site as v0.2, 22 October 2026

**Status: research and design draft. Not community-validated, deployed, clinically reviewed, or a safety certification.**

This package proposes a maintained threat-scenario corpus for LGBTQ+ people, people living with HIV, and the services supporting them. Identity and health status are separate attributes. Service use must never be treated as proof of either.

The intended contribution is a reusable connection between exposure, the person bearing the harm, operational controls, adversarial tests, and product release decisions. Novelty remains a hypothesis. Community security guidance and HIV confidentiality frameworks already exist and deserve attribution and reuse.

## Read in this order

1. [Threat model](THREAT-MODEL.md): scope, trust boundaries, threat register and decision rules.
2. [Prior work and evidence](PRIOR-WORK.md): what was reviewed and what the search cannot establish.
3. [Touchstone review](TOUCHSTONE.md): counterexamples, repairs and remaining perimeter.
4. [SecurePride integration](INTEGRATION.md): routes, tool contracts and release requirements.
5. [Scenario corpus](../../src/data/threat-model/corpus.json): structured synthetic cases, published at <https://securepride.org/threat-model/corpus.json>.
6. [Validation report](VALIDATION.md): structural checks actually run, separate from behavioral assurance.

## What is concrete today

Twelve synthetic threat scenarios, three fully traced adversarial design probes with bounded re-passes, and a proposed integration contract. No real client information was used.

**Published 22 October 2026** (`docs/decisions/DECISION-011.md`): `/threat-model/`, one page per scenario, `/threat-model/walkthroughs/`, and `/threat-model/corpus.json`, all rendered from `src/data/threat-model/corpus.json`. The scanner's no-match result links to SP-02 and SP-11, and an SP-02 fixture runs against the pattern engine on every build. Every control remains *proposed*; publication is not validation.

## Next evidence milestone

Establish whether this corpus is useful and sufficiently distinct through a documented comparison and paid, consent-based review involving people living with HIV, LGBTQ+ community practitioners, service staff, and technical reviewers. Participation must not require disclosure of HIV status, identity, real cases, or proof of community membership. Do not claim community authorship or endorsement before it exists.

The first implementation milestone is one synthetic workflow from reminder creation through device display and fallback care contact, plus one scanner-boundary workflow. Both must produce reviewable test evidence. A polished website or passing schema validator is insufficient.

## Distribution

Published in the Apache-2.0 repository and on securepride.org. Licence check done at publication: the corpus and these documents are original text; cited sources are linked, not republished, and keep their own licences. No endorsement by cited organizations is implied.
