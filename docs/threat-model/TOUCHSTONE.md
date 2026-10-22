# Touchstone adversarial review

21 October 2026 · Design review, not penetration testing

## Verdict

**The broad novelty claim did not hold. The claim that a phone-hardening checklist adequately protects these workflows also did not hold in the scenarios below.** A narrower contribution remains viable: a traceable corpus that treats intervention-induced harm and continuity of care as testable requirements. Its usefulness and safe implementation remain unverified.

## Claim and offered proof

Claim under review: a SecurePride-integrated threat model can meaningfully improve protection for LGBTQ+ people, people living with HIV and supporting services.

Evidence offered so far: public guidance, earlier device recommendations, retrieved SecurePride descriptions and this proposed model. No representative community evaluation, deployment audit, outcome data or device validation exists in this work.

## Boundary ranking

Ranked qualitatively by plausible gap and consequence, not measured probabilities:

1. **Composition: identification without names** — pattern-based redaction can miss linkage. Probed below.
2. **Verifier blind spot: the assessment exposes its user** — a privacy tool can create sensitive state. Probed below.
3. **State/environment: protection interrupts care or increases coercion** — ownership, recovery and sequence matter. Probed below.
4. **Adversarial authority: trusted staff/MDM misuse** — enumerated in SP-05, SP-10 and SP-12; not concretely tested here.
5. **Time: policy drift and retained copies** — included in residual risks, no longitudinal probe.
6. **Input/context edges: minors, language, accessibility, legal variation** — unresolved suitability boundaries; no deployment claim covers them.

## Probe A — disclosure despite successful name removal

**Synthetic starting point:** a worker drafts a story about the only participant from a small island who spoke at a publicly recorded event on a named date. It describes a care visit. No name, address or phone number appears.

1. A pattern scanner finds no matching direct identifier.
2. The draft is labeled safe or forwarded based on that result.
3. A reader correlates the event and location with the public speaker listing.
4. The reader links the care story to a person; even a mistaken inference can harm them.

**Result:** the hypothetical safety claim fails. Pattern absence did not test contextual identifiability. This is not a finding that the deployed scanner makes that claim; the retrieved homepage already warns against it.

**Repair:** remove any sharing authorization from the result; preserve its narrow meaning; require purpose and contextual review; prefer wholly synthetic examples when real detail is unnecessary. Map this boundary to SP-02 and SP-11.

**One re-pass:** remove the island but retain the unique event date and role. The person is still identifiable. A checklist consisting of a few removed fields remains insufficient. The narrower repaired contract holds in this walkthrough because it does not authorize sharing and explicitly tests the remaining combination. Human review can still fail; only a runtime test can verify the UI contract. No claim that redaction guarantees anonymity survives.

## Probe B — a local assessment becomes a disclosure artifact

**Synthetic starting point:** a visitor uses a shared browser. A proposed wizard asks whether their phone is shared and which care workflow they use.

1. The wizard autosaves answers to local storage to improve usability.
2. No answers reach the server, so the implementation is called private.
3. Another user reopens the browser; the wizard restores the answers.
4. The assessment exposes a sensitive care association without a network breach.

**Result:** “local means safe on a shared device” fails.

**Repair:** no automatic answer persistence or export; minimize inputs; no medical-status question; disclose local traces. Avoid building the wizard until it offers value beyond static guidance.

**One re-pass:** memory-only answers avoid ordinary autosave but a sensitive URL, browser back/forward cache, screenshot, crash/session restore or explicit download can retain clues. “Leaves no trace” still fails. The revised claim is limited to specified no-transmission/no-persistence behavior pending browser tests, with clear residual device traces. An exit button must not promise history erasure. This is a resolved claim boundary, not a verified implementation.

## Probe C — stronger device enforcement blocks care

**Synthetic starting point:** an organization recommends supervised phones and a restrictive application policy to everyone using its services.

1. A client relies on a shared phone and one account for appointments.
2. Supervision setup erases the device, or the new policy blocks the portal needed to regain access.
3. Recovery requires an unavailable second factor or controlling household member.
4. The technical policy applies successfully while the client loses timely contact with the service.

**Result:** “restriction applied successfully means protection improved” fails. The original success criterion omitted availability, autonomy and recovery.

**Repair:** distinguish device ownership; require prerequisites and recovery review; prohibit supervision as a condition of care; test essential tasks and a recipient-approved alternative contact path before changes. Record control-induced harm alongside attack risk.

**One re-pass:** a phone fallback also fails if that number is controlled by the same household member. The revised plan needs an independently usable, agreed route rather than merely a second channel. The paper scenario is addressed only when that dependency is checked; actual availability remains untested. If no safe fallback exists, defer the disruptive control and document the limitation.

## Public-site observation

The homepage's processing-information link resolved in retrieval to a self-described template privacy page. This fails a documentation-level expectation of specific processing information. It does not prove actual collection, retention or exposure. The repair is to inspect real data handling and reconcile the disclosure; a new assertion of no logs would not be a valid repair without evidence. No repair was applied or verified.

**Recheck, 22 October 2026:** the live privacy page and its source are a specific processing notice that names its unverified hosting details; the template observation no longer holds. Reconciling the notice against a full processing inventory remains open.

## Perimeter

No attack traffic, scanner requests, real records, browser execution, device changes, profile installation, source-code audit, forensic investigation, participant interviews or clinical/legal assessment. These are design counterexamples walked through step by step as permitted by the skill, not executed exploit results. The structural validator tests the corpus format and references only. No novelty claim, global suitability claim or safety guarantee has been established.
