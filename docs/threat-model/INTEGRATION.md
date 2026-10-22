# Intrinsic integration with SecurePride

Design contract v0.1. Proposed routes and behavior.

## Implementation status — 22 October 2026

| Contract item | Status |
|---|---|
| `/threat-model/` readable model, no account, no questions | Built (`src/pages/threat-model/index.astro`) |
| `/threat-model/scenarios/sp-01/` … `sp-12/` | Built from the corpus (`scenarios/[id].astro`) |
| `/threat-model/corpus.json` versioned public corpus | Built (`corpus.json.ts`, corpus v0.2) |
| Tool pages carry scenario IDs beside the boundary | Scanner: no-match result and `/tools/` link SP-02 and SP-11 |
| SP-02 scanner-boundary test | `src/lib/threat-model/sp02-scanner-boundary.test.ts`, every build |
| Structural corpus checks in CI | `src/lib/threat-model/corpus.test.ts` |
| Contributor workflow names affected scenarios | Stated on `/threat-model/`; not yet enforced in the PR template |
| SP-01 reminder workflow | Not built — Secure Pride sends no reminders today |
| Interactive planner | Not built, by design (SP-03) |
| Device-control modules | Not built |


## Product structure

Make the model the shared basis for tools, guidance, and release review. A standalone essay would not achieve this integration.

1. `/threat-model/`: readable scope, assumptions, evidence status and scenario index. Reading requires no account and no personal answers.
2. `/threat-model/scenarios/sp-01/` and equivalent pages: plain-language situation, who could be affected, control options, new risks, tests and limits. These routes describe generic scenarios; they must not encode a visitor's assessment.
3. `/threat-model/corpus.json`: versioned public synthetic corpus, suitable for downstream reuse.
4. Tool pages: associate relevant scenario IDs and show the tool's capability boundary beside its result or action.
5. Contributor workflow: changed tool behavior must identify affected scenarios and attach appropriate test evidence.

Render documentation from the same reviewed corpus where practical. Do not introduce a numerical personal risk score. Keep unknowns and disagreements visible.

## Scanner integration

Map scanner behavior to SP-02 and SP-11. A no-match result must explain that identifying context can remain. It must not become a “safe to share” decision or automatically forward the text. Use synthetic examples for tests and public demonstrations. The current public homepage warns against sensitive submissions; any design must preserve that boundary unless the actual processing model changes and is reviewed.

Before linking a private assessment to a scanner, inspect the route's actual processing, logging, retention and third-party data flows. A local Rust/WASM implementation is a separate future claim until its runtime and network behavior are tested. Do not call a hosted interface local merely because its HTML or JavaScript is local.

## Optional planning interface

The first release can be static guidance and a downloadable blank worksheet. An interactive planner is conditional on review of SP-03. Ask about capabilities and constraints, not medical status, sexual orientation, real names or case narratives. No automatic geolocation or inferred jurisdiction. A regional selection must be optional and based on reviewed content.

If implemented, proposed defaults are memory-only answers, no autosave, no analytics or session replay, no answers in URLs, no answer-bearing error logs, no third-party fonts/scripts, and no automatic export. Document that hosting still receives ordinary page requests and that browser/device traces may persist. “No answer upload” and “anonymous use” are different claims.

Downloading an assessment can expose it through Downloads, backups or sync. Explain that consequence before an explicit download and use a neutral filename. A quick-exit action may replace the visible page but must never claim to erase history or monitoring evidence. Do not claim these requirements are achieved until browser, network, error, storage and restore tests run.

## Device-control guidance

Platform-specific modules belong under the model, not above it. For Configurator, every proposed restriction needs supported platform/version, supervision requirement, erase implications, management authority, recovery and care-access tests. No installable profile should be generated from an unreviewed risk questionnaire.

A high-risk individual's personal phone must not be enrolled merely to satisfy an organizational checklist. For organization-owned staff devices, evaluate management compromise and support burden alongside the protection gained. Lockdown Mode guidance must include usability effects and the distinction between prevention and forensic assessment.

## Release requirements

| Requirement | Evidence needed | Current status |
|---|---|---|
| Accurate processing disclosure | Code/config/logging inventory aligned with public policy | Not assessed; retrieved template-policy mismatch open |
| No sensitive assessment transmission | Browser network capture through success, failure and retry paths | Proposed, not implemented |
| No unintended answer persistence | Storage, history, back/forward, reopen, crash and restore checks | Proposed, not implemented |
| Scanner result does not authorize disclosure | Synthetic no-match contextual-identification tests plus UI review | Design probe only |
| Care access survives controls | Named essential workflows tested on actual device/profile versions | Not tested |
| Accessible under pressure | Keyboard, screen reader, low bandwidth and comprehension sessions | Not tested |
| Contextual suitability | Consented community/service review and jurisdiction-specific assessment | Not conducted |
| Safe incident intake | Responsible owner, channel, access, retention and escalation agreed | Not established by this package |

## Maintenance

Maintain a version, reviewed date, owner and evidence for each platform control. Trigger review after OS changes, service-flow changes, failed tests, or evidence that recommendations cause harm. Mark stale guidance as unverified rather than silently carrying a green badge forward. Publish synthetic corrections with provenance; keep incident identities private.

Proposed roles, not assignments: maintainer owns technical releases; service practitioner reviews continuity; community reviewers assess constraints and harms; qualified local reviewers address legal/clinical scope. No one role certifies the whole system.

## First bounded implementation

Start with SP-01 and SP-02: build one neutral reminder example with sender/preview review and one scanner result showing residual contextual risk. Attach the scenario IDs to the actual UI and tests. Then implement static model pages. Build an interactive assessment only if it provides demonstrated value over the static version and passes the additional exposure checks.

The corpus now has a website adapter and build-time tests (see Implementation status). Runtime behaviour beyond the scanner boundary remains untested.
