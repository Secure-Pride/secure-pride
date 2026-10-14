# DECISION-009: Adopt the founder's security policy for Secure Pride, with graded controls

**Status**: Proposed — the founder supplied the policy and asked for this adaptation; the items under *Needs founder sign-off* are Tier 3 (policy and legal) and wait for an explicit yes before merge.
**Date**: 2026-10-14
**Category**: Security / Policy / UX
**Decision ID**: DECISION-009
**Authority**: Tier 3 for policy wording (approved in principle by the founder's request; specifics below); Tier 2 for the page design (documented here).
**Decision maker**: Claude, at the founder's direction ("here is my official security policy that can be adapted for secure pride")

## Context

- `/security/` carried a visible template note ("This is a template security policy. You must customize this document…") and promised acknowledgment within **48 hours**. `SECURITY.md` promised an initial response within **5 business days**. DECISION-008 flagged both and left them for the founder.
- The founder supplied *Security Policy 2.0.0 (Personal Projects Edition)*, effective February 1, 2026, written for all `@mazze93` repositories. It promises acknowledgment within **72 hours** and a **90-day** default disclosure deadline.
- The source lists repository, CI/CD, and dependency controls "where applicable". Checked against this repository on 2026-10-14, several are in place, several are settings no outside reader can see, and four are not in place (SHA-pinned actions, signing and provenance, SBOM, licence checks).
- The site's copy rule since #67: no assurance language, limits on the record.

## Options considered

**A. Publish the source verbatim.** Fastest. Every control line would read as a guarantee, including four that are not true of this repository today.

**B. Publish only the reporting process; leave controls out.** Honest by omission, but drops a large part of the founder's policy and hides the gaps instead of naming them.

**C. Publish the policy with each control graded by how a reader can check it.** Chosen.

## Decision

Option C.

- **One source, two outputs.** The policy is data in `src/lib/site/security-policy.ts`; `/security/` renders it and `SECURITY.md` states the same text. `security-policy.test.ts` fails if `SECURITY.md` drifts (facts, every table row, every list item) or brings back "48 hours" or "5 business days".
- **Graded controls.** `src/lib/site/security-controls.ts` gives every control one of four grades — *In the repository*, *Partly in place*, *Owner's statement*, *Not yet in place* — with one sentence of evidence. Grades that can be checked from files carry probes; `security-controls.test.ts` re-runs them against `.github/workflows` and also runs each probe against a seeded workflow that has the feature, so a passing "not yet" result cannot come from a blind probe.
- **Reporter-first order.** Report → what to include → what not to report → timeline → commitments → severity → safe harbor; then scope, controls, contributor practice, and the document record. An "On this page" index links all eleven.

## Adaptation — every change from the source wording

| Source | Site | Why |
| --- | --- | --- |
| "across my GitHub repositories at @mazze93" | "for Secure Pride: the securepride.org site and the code at github.com/mazze93/secure-pride" | Scope is this project, not the personal account |
| "I take security seriously and welcome collaboration…" | "I welcome collaboration…" | Assurance phrase; the site does not use them |
| Scope bullet "Personal projects and experimental code" | removed; "The securepride.org website and subdomains" added (from the old page) | Not applicable / keeps existing coverage |
| Alternative contact: "security contact listed in repository README" | `security@securepride.org` | The README lists that address |
| `\checkmark`, `\texttimes` in the versions table | "Supported", "Not supported" | LaTeX macros leaked into the PDF (page 1); words also read correctly in a screen reader |
| "Security Resources" links | OWASP and OpenSSF links updated to their current addresses (`owasp.org/projects/secure-coding-practices-quick-reference-guide`, `bestpractices.dev`) | The source URLs redirect there |
| "refer to individual repository documentation regarding data handling" | kept, plus "For securepride.org, that is the privacy and processing page" | Points at the real document |
| Controls listed as facts | graded, with evidence and a check date | Option C |
| — | Old `SECURITY.md` "Security Standards" kept as "Project standards" | Project-specific rules (zero telemetry, protect identity data) are not in the source and should not be lost |
| Page head | Heading "Report it privately. The repair goes on the record."; plate title "Two numbers to hold me to." | New copy, needs sign-off |

Legal text (safe harbor conditions, CFAA/DMCA paragraph) is verbatim.

## Needs founder sign-off (Tier 3)

1. **Adoption and the wording table above**, especially the two new lines of copy.
2. **Publishing graded controls**, including the four *Not yet in place* lines. The alternative is Option B.
3. **The *Owner's statement* rows** (branch protection, secret scanning, code scanning, signed commits, hardware-key 2FA, access control, manual audit) are published on your word. Confirm each is true for this repository, or say which to downgrade.
4. **Private vulnerability reporting must be enabled** (Settings → Code security) before this ships: the page's primary button opens `…/security/advisories/new`. This session could not read repository settings.
5. **Acknowledgment vs. severity.** Acknowledgment is "within 72 hours"; a Critical incident's response time is "24 hours". Both are the source's numbers. Decide whether a Critical report also gets a faster acknowledgment.

## Rationale

- **Values**: the plate shows the two numbers a reporter can hold the project to, and the ledger shows what is and is not in place. Visible repair, visible seam — the same idea as the home vessel.
- **Trade-off accepted**: the page is long (eleven sections). It is a policy; the index, numbered sections, and reporter-first order keep it navigable.
- **Risk mitigated**: a stale grade. The probe test fails the moment a gap closes or a verified control regresses; the check date is on the page.
- **Success**: no line on `/security/` claims something a reader could check and find false.

## Design notes (Tier 2)

- **Plate**: full-bleed charcoal band with the obsidian shield artwork (provenance: `docs/brand/art/README.md`), 72 hours / 90 days set in Shippori Mincho B1, two actions. The artwork is cropped to the shield and blended `lighten` over a dark spotlight so its black ground disappears; no text sits on it.
- **Timeline**: the six CVD stations sit on the gold seam from the editorial source. The `<ol>` carries the meaning; the seam is `aria-hidden` and becomes a vertical gold rule below 760 px.
- **Accessibility**: grades are words in every row (colour and border style only repeat them); tables restack on phones with labels; every standalone link and button is at least 44 px tall; anchors clear the sticky header.

## Implementation

- `src/lib/site/security-policy.ts`, `security-controls.ts` (+ tests), `src/components/site/SecurityPlate.astro`, `DisclosureTimeline.astro`, `ControlsLedger.astro`, `src/styles/site-policy.css`, `src/pages/security.astro`, `SECURITY.md`, `README.md` (report section).
- Rollback: revert the commit; the old page and `SECURITY.md` come back together.

## Outcome (updated later)

- _Pending founder review._
