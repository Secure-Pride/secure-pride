# Secure Pride Desk — Base44 build specification

Status: build-ready specification; not yet executed in Base44.
Prepared: 2026-11-16.
Scope: a working public demonstration using fictional operational metadata only; later private use requires separate security verification.

## Source model and adaptation

Reference: [mazze93/touchstone at 1bfbef981efe5da63bc65532bc1b837c322ff8d1](https://github.com/mazze93/touchstone/tree/1bfbef981efe5da63bc65532bc1b837c322ff8d1).

Source files inspected:
- README.md — defensive operations desk, metadata-only boundary, Rust crates, local-first demo.
- src/lib/types.ts — partners, engagements, findings, governance, authority basis.
- src/lib/store.tsx — browser-local state, create/update functions, governance toggles.
- src/app/app/findings/page.tsx — intake checks, offline references, editable status/disclosure.
- src/app/globals.css — readable desk structure and typography.
- crates/touchstone-integrity/src/lib.rs — Rust session escalation, tripwires, and audit chain.

Adapt the workflow and concepts; write a new implementation rather than copying unlicensed source. No LICENSE file appeared in the inspected repository tree. This is not a determination of reuse rights.

### What carries over

| Touchstone concept | Secure Pride adaptation |
| --- | --- |
| Partners | Fictional nonprofit partner aliases |
| Engagements | Scoped security support with owner, next action, due date |
| Payload-free findings | Operational risks, affected workflow, proposed control, limits |
| Disclosure stage | Internal review and partner communications; no automatic publication |
| Governance | Consent, scope, data handling, evidence review, incident contact |
| Offline reference | Opaque OFF-… reference; never a private vault URL or credentials |
| Authority basis | Claim basis displayed separately from workflow state and review result |

### What must improve

The inspected web findings page allows direct status changes, including closed, without an evidence-review gate. The local store trusts parsed browser state, substitutes seeds on read errors, and forces the no-payload acknowledgement true in addFinding. The inspected page/store do not invoke the Rust integrity module. These observations are static inspection findings, not a runtime vulnerability assessment.

Do not reproduce those shortcuts. Validate every write path and imported state, preserve an unchecked acknowledgement as unchecked, require evidence review before closure, and surface persistence/import failures. Do not claim Rust, Stratum, STELE, Checkmate, cryptographic anchoring, or tamper-proof history is integrated into the Base44 app.

## Paste-ready Base44 build prompt

Build a complete working application named **Secure Pride Desk**. It is Secure Pride’s security operations desk for nonprofit partnerships, scoped assessments, remediation, and evidence review. Model the workflow on Touchstone, adapting its metadata-only desk concept to LGBTQ+ nonprofit security. This is a functional product demonstration, not a marketing landing page.

### Delivery boundary

Implement the first version as a public, single-browser, synthetic-data demonstration. Use validated browser-local persistence. Do not create a shared anonymous database or send form contents to analytics, AI services, scanners, email, or third-party APIs. No file uploads, clipboard collection, external automatic actions, account setup, live customer records, or secrets. Build the entire requested demo with working controls and real local state; do not render fake integrations or inert action buttons.

Display a persistent banner: “Fictional demonstration. Changes stay in this browser. Do not enter real client records, credentials, identity details, or private evidence.” Explain that browser-local storage is neither encrypted storage nor a multi-user access boundary. This demo can illustrate operations but is not approved for sensitive operational use.

### Visual direction

Create an editorial operations desk with a charcoal navigation rail, warm porcelain workspace, deep indigo headings, and restrained aged-gold seams that connect a risk to its remediation record. Use gold as an accent, not low-contrast body text. Make **Surface**, **Edge**, and **Record** the three principal views:
- Surface: current engagements and one next action.
- Edge: findings and the boundaries of the proposed protection.
- Record: evidence references, review decisions, and governance history.

Additional navigation: Partners, Governance, About. Label each unfamiliar view with a plain subtitle. No rainbow stock imagery, people illustrations, generic hero gradients, decorative charts, or protection scores. Integrate the kintsugi idea through visible revision history and repair, without suggesting that cosmetic treatment repairs a security failure.

Use strong typographic hierarchy, a legible sans serif for work, a distinctive editorial display face only for short headings, and a monospace for opaque references. Use available font dependencies or system fallbacks; no runtime tracking/font-provider requirement. Minimum 16px body text, clearly visible focus, text labels alongside status colors, keyboard-accessible dialogs, labeled errors, reduced-motion support, and responsive layouts down to 360px. Tables may become cards on narrow screens. Show no more than five metrics, all derived from local demo records. Provide useful empty states.

### Data model

Use schemaVersion 1, stable IDs, ISO timestamps, and referential validation. All records are fictional. A record contains:

Partner:
- id, alias, organizationType, region, engagementStatus, notes.
- Use aliases such as “Harbor Mutual Aid — fictional.” No personal contact fields in the demo.

Engagement:
- id, partnerId, title, objective, scope, ownerAlias, status, nextAction, nextActionDue, createdAt, updatedAt.
- Status: scoping, active, paused, completed, archived.
- Owner aliases such as “Coordinator A.” No actual identities.

Finding:
- id, engagementId, title, category, severity, status.
- category: identity, access, communications, data-handling, vendor, governance.
- severity: low, medium, high, critical. Label severity a human assessment, not a validated risk score.
- status: intake, triaged, remediating, review-requested, closed, reopened, archived.
- operationalSummary, affectedWorkflow, proposedControl, controlTradeoff, smallestNextProbe, ownerAlias, dueDate.
- authorityBasis: narrative, provisional, authoritative_verified, authoritative_axiomatic.
- Show readable labels: reported, provisional, supported by reviewed evidence, adopted policy assumption. A policy assumption is not empirical verification; selecting a basis never confers authority or closes a finding.
- acknowledgedMetadataOnly boolean, offlineReferenceId matching OFF-[A-Z0-9-]+, createdAt, updatedAt.

EvidenceReference:
- id, findingId, opaqueReference matching OFF-[A-Z0-9-]+, summary, evidenceType, collectedAt, recordedByAlias, isSynthetic.
- No documents, secrets, payloads, private links, or identifying narratives. The summary describes what an external check covers, not its sensitive contents.

Review:
- id, findingId, evidenceIds, reviewerAlias, reviewedAt, result, rationale, limitations.
- result: supports-fix, inconclusive, contradicts-fix.
- In the demo, reviewer aliases are simulated, not authenticated independent reviewers.

HistoryEvent:
- id, recordType, recordId, action, fromStatus, toStatus, actorAlias, timestamp, reason.
- Append new events through app operations. Existing events are not editable in the interface. State plainly that this is local activity history, not a tamper-evident or independently anchored audit trail.

GovernanceCheck:
- id, title, description, required, completed, completedByAlias, completedAt, scope.
- Checks: engagement scope agreed, operational-metadata boundary understood, owner assigned, evidence reference recorded, limitations reviewed, escalation contact process defined.
- Completing or reopening a check adds history; preserve earlier events.

### Required interactions

1. Surface dashboard shows active engagements, open findings, overdue next actions, review queue, and a prominent “One next action” card. Counts derive from actual records. Synthetic records never count as real customers or pilots.
2. Partners view supports add, edit, filter, and archive. Preserve archived records and relationships. Do not implement delete or erase/reset actions.
3. Engagements support add/edit, scope, owner alias, due date, next action, status changes, and related findings. Require a real selected partner ID.
4. Edge supports list/search/filter by severity, category, status, and owner; intake opens a focused dialog. A finding detail panel shows its claim, affected workflow, control, tradeoff, next probe, evidence, and history.
5. Require the metadata-only acknowledgement on each finding creation and content edit. Do not force it true in storage. Enforce required fields and validate input lengths in one shared validation layer used by all operations and imports.
6. All fields and JSON imports must apply basic guardrails for obvious credential material and disallowed payload-shaped content. Reject entire invalid operations without partial writes. Explain: “Pattern checks are incomplete. No match does not establish safe content.” Do not call this data-loss prevention or a guarantee. Disallowed input is not persisted or copied into error logs/history. Ordinary descriptions such as “Credential rotation policy needs review” must remain allowed.
7. Status transitions follow a shared state-transition function. The UI must not expose a direct closed status dropdown. Closing requires a linked evidence reference and a supports-fix review covering that evidence, a reviewer alias different from the owner alias, and a rationale stating scope/limits. Same alias, missing evidence, inconclusive, or contradicting reviews block closure with a specific explanation. Alias separation demonstrates a rule; it does not prove independent review.
8. Editing a closed finding’s substantive content or changing supporting evidence invalidates the previous closure and reopens the finding with a history event. New inconclusive or contradicting review also reopens a previously closed finding. Preserve the prior review and record why its support is no longer current.
9. Evidence references and reviews can be added from the finding detail. Reject references to missing findings or evidence belonging to a different finding.
10. Record view lists review outcomes and history chronologically, with filters and a clear distinction between reported facts, policy assumptions, and workflow decisions.
11. Governance checks can be completed and reopened, with actor alias and history. Do not let check completion alone close a finding.
12. Export a portable JSON snapshot with schema version and export timestamp and a Markdown report describing findings, next steps, evidence references, and explicit limitations. Also provide copy-to-clipboard for the report only on an explicit click. Failures are visible.
13. Import JSON through a size-bounded text field, maximum 1 MiB, with schema and relationship validation, preview, and explicit confirmation. It merges new IDs; conflicting IDs or invalid data fail without overwriting current records. Never accept imported closed state as validated: mark imported closed findings reopened/pending review and explain why. Do not log imported rejected text.
14. Persist across reload. On malformed or incompatible existing state, show a recovery screen and offer to download the raw local data for the user; do not silently replace it with seeds or overwrite it. If storage is denied/full, show an actionable failure and do not claim data was saved. No destructive reset.
15. About explains scope, storage, known limits, the Touchstone source reference, synthetic fixtures, and absence of cryptographic integration. Link to https://securepride.org/tools/ and https://securepride.org/threat-model/ for context.

### Seed a meaningful demonstration

Use two clearly fictional nonprofit aliases, two engagements, and three findings:
- A reminder workflow could reveal an association with care. Status remediating, no supporting review; proposed control neutral reminder wording; tradeoff reduced recognizability.
- Access removal ownership is unclear. Status review-requested with a synthetic evidence reference and an inconclusive review, so closure stays blocked.
- A public sharing checklist lacks a second review. Status closed only with a synthetic supports-fix review and linked synthetic reference. Label the closure as a demonstration, not proof of an actual control.

Use offline references OFF-DEMO-001 through OFF-DEMO-003. Seed all timestamps explicitly and label fixtures. No actual nonprofit names, vulnerabilities, customers, impacts, adoption metrics, or success percentages.

### Verification before declaring completion

Demonstrate: partner → engagement → finding creation; unchecked acknowledgement refusal; missing evidence refusal; same-reviewer-alias refusal; inconclusive review refusal; valid synthetic reviewed closure; reopening after content change; JSON export/reload persistence; malformed and conflicting JSON import rejection; untrusted imported closed state reopened; mobile layout and keyboard operation. Preserve any failed check and state exactly what is incomplete. Do not claim passing checks unless actually executed. Do not publish a private operational database. If public-demo publishing requires a separate action, show the built preview and its publication controls first.

## Continuation instructions for the operator

1. Sign in to Base44 with the intended account.
2. Open the new-app builder and paste the prompt above. Creating this demo is authorized; accepting new binding agreements requires separate confirmation.
3. Inspect the generated implementation and run VERIFICATION.md. Record actual results rather than relying on generated summaries.
4. Obtain the exact app/preview URL. A preview URL requiring owner login is not the public reviewer link required by the accelerator.
5. Publish only the synthetic demonstration after checking what publication exposes. Do not broaden access to any live records.
6. Update APPLICATION.md and the live application with the actual built state, exact app URL, and truthful use description.
7. Add a timestamped build-result entry identifying Base44 app ID, URL, visible version identifier if available, checks performed, failures, and rollback/export artifact.

## Production use gate

The demo’s usefulness does not establish production readiness. Before real operational metadata is hosted: review Base44’s data handling and logging; implement authenticated roles, server-enforced authorization and relationship checks, tenant isolation if multiple organizations are introduced, and server-enforced workflow gates; verify direct calls cannot bypass them. Define retention, backup/export, incident response, and recovery. Keep sensitive client records outside this system. A browser-only rule and a separate reviewer alias are not authorization controls.
