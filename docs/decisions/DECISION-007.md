# Decision: Publish a guided, path-routed 802.1X (WPA2/3-Enterprise) field guide

**Date**: 2026-10-11
**Category**: UX / Accessibility / Security guidance / Privacy
**Decision ID**: DECISION-007

> Numbering note: `decisions/` and `docs/decisions/` both exist and both
> contain a `DECISION-003` with different content. This file takes the next
> number after the highest in either log and lives in `docs/decisions/`, the
> more recently maintained log. Reconciling the two logs is out of scope here
> and is flagged in the PR.

## Context

Secure Pride planned an internal 802.1X rollout (FreeRADIUS, step-ca, MDM,
UniFi) as Phase 1, with a partner deployment kit as Phase 2. The founder asked
for a module on securepride.org that walks an end user through the process from
beginning to end.

Verification before writing surfaced five problems in the earlier planning
notes. The guide must not repeat them:

1. **MDM pricing.** "Mosyle is free for nonprofits under ~30 devices" could not
   be verified; a 2026 pricing tracker reports no free tier. The guide does not
   name a price and treats MDM as optional.
2. **RADIUS transport.** Plain RADIUS (UDP 1812) crossing the internet to a VPS
   is exposed to Blast-RADIUS (CVE-2024-3596) Access-Accept forgery. The guide
   requires FreeRADIUS 3.2.5 or newer, `require_message_authenticator = yes` per
   client, a long unique shared secret, and either an on-site RADIUS host or an
   encrypted tunnel to a remote one.
3. **Revocation.** step-ca revocation is passive by default (it blocks renewal).
   EAP-TLS keeps accepting a revoked certificate until it expires unless
   FreeRADIUS checks a CRL. The guide enables the step-ca CRL and FreeRADIUS
   `check_crl`, and keeps device certificates short-lived.
4. **"Eliminates evil-twin attacks."** True only when every device validates
   the server certificate against a pinned CA and server name. The guide says
   so, and covers Android 11+'s CA + Domain requirement.
5. **"Satisfies GDPR/CCPA."** Overclaim. Per-device logs support accountability
   evidence; they do not satisfy a regulation. Removed. A "shared certificate"
   low tier was also dropped — it discards per-device identity, which is the
   point of the change.

## Options considered

**Audience**
- *(A) Device-owner enrollment only.* Small, but leaves the hard part — the CA,
  RADIUS, and access points — to an unstated someone. Not "beginning to end."
- *(B) The person setting it up for their organization, with device enrollment
  as one stage.* Chosen. Matches who Secure Pride serves: a staff member or
  volunteer at a small organization who is not a network engineer.

**Format**
- *(A) Long static article.* Simple, but every reader sees every branch, which
  is the opposite of low cognitive load.
- *(B) Short intake → one recommended path → stage-by-stage checklist.*
  Chosen. Six questions decide which steps appear. Organizations whose access
  points cannot do WPA-Enterprise, or who have no one to maintain it, get an
  honest "not yet" path with hardening steps that do fit.

**Progress persistence**
- *(A) None.* Matches DECISION-006's scanner stance, but a setup that takes
  8–12 hours across a week loses all progress on tab close. That defeats an
  ADHD-accessible design.
- *(B) Opt-in browser storage, off by default.* Chosen. Stores only intake
  choice IDs and completed step IDs — no free text, no names, no secrets. A
  visible control explains exactly what is saved and clears it. Storage
  failures (private mode, blocked storage) are caught and reported.
- *(C) Markdown export.* Added alongside B. Produces a dated checklist the
  reader keeps in their own notes, independent of the browser.

**Data entry**
- The guide never asks for, displays fields for, or stores shared secrets,
  passwords, keys, hostnames, IP addresses, or anyone's name. Commands use
  placeholders the reader replaces in their own terminal.

## Decision

Ship `/tools/wifi-enterprise` as a static Astro page with one React island.
Pure TypeScript modules hold the intake questions and path routing
(`paths.ts`), progress state and export (`progress.ts`), and the stage
content (`content/*.ts`). The UI only renders them. No network requests, no
server code, no analytics. Content is versioned with semver
(`GUIDE_VERSION`, starting at `0.1.0`) and labeled as a draft that Secure
Pride is validating internally, consistent with DECISION-006's rule against
claiming more than has shipped.

### Pseudonymous device identity

Certificate names, RADIUS logs, and VLAN mappings use role-based device IDs
(`staff-laptop-07`), never legal names, chosen names, or pronouns. The mapping
from device ID to person lives in the organization's password manager, not on
the RADIUS or CA host. A compromised RADIUS log then reveals device activity,
not who is connecting. Personal (BYOD) devices are routed away from MDM
enrollment by default: MDM on a personal phone can expose personal data, which
is a heightened risk for LGBTQ+ staff.

## Rationale

- **Alignment with values**: privacy-first (no data leaves the browser),
  pseudonymity by design, ADHD-accessible (one path, short steps, "done when"
  criteria, resumable progress), honest about limits.
- **Trade-offs accepted**: the guide gives generic UniFi-style access-point
  steps because labels change between controller versions; it names the
  setting to look for rather than promising exact menu paths. Commands are for
  Debian/Ubuntu hosts; other platforms link to official install docs.
- **Risks mitigated**: stale or wrong commands (commands were executed against
  step-ca and FreeRADIUS 3.2.5 in a sandbox before publishing — see Outcome);
  overclaiming (draft label, explicit limits); lock-out during cut-over (old
  network stays up until verification passes; a documented break-glass step).
- **Success criteria**: an organization can reach a verified, per-device,
  CRL-checked EAP-TLS network by following one path; unit tests cover routing
  and progress; `npm run check` and `npm test` pass; keyboard and screen-reader
  flow works at mobile and desktop widths.

## Implementation plan

1. Pure logic with tests: path routing, step filtering, progress reducer,
   storage adapter, Markdown export.
2. Stage content as typed data with `appliesTo` predicates.
3. React components: intake, path summary, stage navigator, step checklist,
   progress controls.
4. Astro page under `ToolLayout`; footer link.
5. Execute the published step-ca and FreeRADIUS commands in a sandbox; correct
   any that fail before merge.

## Rollback

Revert the feature commit(s). The page is additive: no shared component,
layout, token, or API changed except one footer link.

## Outcome (updated later)

- Implemented as planned. Full record:
  [wifi-enterprise-lab-verification.md](../guides/wifi-enterprise-lab-verification.md).
- Server lab (step-ca 0.30.2, FreeRADIUS 3.2.5, eapol_test): 21 checks.
  It caught a lock-out bug before publishing — step-ca's CRL carries a
  critical Issuing Distribution Point, and without a matching CRL
  Distribution Point in each certificate OpenSSL rejects every login
  ("different CRL scope"). Fixed by a provisioner template plus `idpURL`.
- Lab also showed revocation is not enforced until FreeRADIUS restarts (a
  HUP is not enough) and that an expired CRL blocks every login. Both are
  now explicit steps and watch-outs.
- Device certificate lifetime set to one year, not 90 days: with CRL
  revocation proven, quarterly hand re-installs would cost small teams more
  than the shorter window protects.
- Tests: 123 across the repo (50 for this guide, covering all 1,440 intake
  combinations). Browser driver: 27/27, zero axe WCAG 2.1 AA violations.
- Found, not fixed (out of scope): the repo's `_headers` CSP is not
  deployed, and would blank every tool page if it were.
- Remaining: Secure Pride's own Phase 1 rollout is the real proof. Version
  `1.0.0` should wait until the internal cert lifecycle (issue → renew →
  revoke → CRL rejection) has been observed on real access points.
