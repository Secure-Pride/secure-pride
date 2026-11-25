---
title: Secure Pride history timeline
date: 2026-11-25
version: 1.1.0
repo: Secure-Pride/secure-pride
tags: [secure-pride, history, timeline, evidence-trail]
---

# Secure Pride history timeline

A dated record of how Secure Pride got from its first commit to today, with each change in direction and the evidence behind it. Built 2026-11-25 from repository history; nothing here is from memory alone. v1.1.0 (2026-11-25) adds the founder's reason for the monorepo.

## How to read this

Every event carries a basis tag:

- **[V] Verified**: read directly in a commit, pull request, decision record or deployment record.
- **[F] Founder's account**: Mazze's own words, not yet matched to an artifact.
- **[I] Inferred**: a reading of the evidence, not something any artifact states. Treat as a hypothesis.

Links go to `github.com/Secure-Pride/secure-pride` unless noted. `C` is a commit, `#` a pull request, `D-` a decision record.

## Sources read

| Source | What was read | Gaps |
|---|---|---|
| `Secure-Pride/secure-pride` | All 208 commits on `main` (first 2026-01-11), 319 commits across all branches, 57 non-dependency PRs (#1 to #122), all decision records, `docs/journal/` (Aug consolidation), `docs/history/` | Commit author field shows who pushed, not who wrote the code |
| `Secure-Pride/secure-pride-design` (private) | All 10 commits, 2026-04-22 to 2026-09-11 | Files not read |
| Absorbed repos (`macos-privacy`, `secure-pride-aegis-icons`, `secure-pride-hf-profile`) | Their histories, preserved inside the monorepo since 2026-10-21 | None |
| Tool inventory review, 2026-11-25 | Cloudflare deploy records (Worker versions, Pages deployments), live-site copy | Separate document, reused here |
| Not read | `Secure-Pride/demo-repository` (private), `wireshark-beginner-kit`, `mazze93/projects-workspace` (history purged), Cloudflare Pages build logs | Listed under Open questions |

## The short version

Secure Pride started in January 2026 as a governance document and a landing page plan for an LGBTQ-focused privacy and security nonprofit. Through the spring it tried several shapes (an audit toolkit, a credential audit dashboard on mock data, a document engine) before settling in May and June on one real tool: the AI Safety Scanner. In July, adversarial testing found the scanner's TypeScript engine could be bypassed silently; that led to the Rust/WASM rewrite in August. August and October brought two honesty passes that pulled the site back from claims it could not support, and in October the threat model became the centre of the site and the project moved into its own GitHub organization as one monorepo. In November the Rust scanner finally reached production, but only after the site moved from Cloudflare Pages to a Worker, because Pages had stopped deploying after October 22.

## Shifts in direction

Eight changes in direction, each with what triggered it.

| # | When | From → To | What caused it | Evidence | Basis |
|---|---|---|---|---|---|
| 1 | 2026-04-29 | Hand-coded landing page, Audit Toolkit and a credential audit dashboard on mock data → one Astro site | Commit names it a migration; the dropped pages are called "unused". Motive beyond that is not recorded | C `f9169df` | [V] change, [I] motive |
| 2 | 2026-05-02 → 06-06 | Mock credential audit feed → a live AI Safety Scanner (DLP) as the flagship tool | A Python DLP prototype was ported to TypeScript; #12 says it "replaces the mock credential audit feed with a live text scanner" | #12 (closed unmerged), #21 / C `395565b` | [V] |
| 3 | 2026-08-14 | "This is the product", a live $200/mo tier → pilot-stage honesty | A deck-vs-site audit found the site overclaiming: no paying clients beyond one standing partnership, and a self-host Docker claim whose command did not run the scanner | C `cdb1336`, #47 | [V] |
| 4 | 2026-08-20 | TypeScript regex engine → Rust/WASM engine, fail-closed by construction | D-002 (scanner series, 2026-07-18) confirmed silent bypasses: zero-width spaces, Cyrillic homoglyphs, paraphrase, card and SSN misfires, all falling through to `PASS`. Found while adversarially testing the audit-logging fix | `decisions/DECISION-002.md`, `decisions/DECISION-003.md`, #49 | [V]; matches the founder's account [F] |
| 5 | 2026-10-02 | Broad promises (organizational protection, provider integrations, local processing, paid pilot) → only what has shipped | Founder-approved assessment: the homepage promised beyond the shipped surface, the scanner UI hid the masked draft and showed hard-coded assurance percentages | D-006, #67 / C `cdf1ee9` | [V] |
| 6 | 2026-10-21 | Four separate repos under a personal account → one public monorepo in the `Secure-Pride` org | Separation of the organization from its builder. In the founder's words: the mission "is bigger than any single individual", and keeping development "anchored to my personal github" meant it could not be fully isolated "in a way that guarantees personal data isolation and other sensitive boundaries". The monorepo "allows SP to be the authority in its own wheelhouse" and is "a necessary layer of separation between the organization and its sole builder" (2026-11-25). This reverses the August Phase 4 journal, which marked a monorepo "Not recommended" for a different goal (reading as one offer to funders); the October move answers a governance need that journal did not weigh | #72, C `22d0690`, `docs/journal/PHASE4-STRATEGY.md` | [V] change, [F] cause |
| 7 | 2026-10-22 | Tools-first site → threat model (*disclosure, coercion, and continuity of care*) at the centre | Founder direction, building on a threat model drafted 2026-10-21 | D-011, #90 / C `f009ed0` | [V] |
| 8 | 2026-11-10 → 11-13 | Cloudflare Pages → a Cloudflare Worker serving the site and `/api/*` | Pages was still serving the old scanner and its builds could not be read or fixed from the available connection; `main` already held the Rust route | D-015, #108, Worker first upload 2026-11-13 | [V]; matches the founder's account [F] |

An emerging ninth: from November 16, work toward an accelerator application (Base44 Cohort 2) and an operations desk modelled on Touchstone. Drafted, not submitted; the build is blocked at sign-in (#117). Too early to call a shift.

## Correction to an earlier belief

The working belief was that several tools "dropped out when Secure Pride became an organization". The evidence does not support that cause.

- The org move (#72, 2026-10-21) changed no site file. Checked: `git diff 3acef51 0514cf0 -- . ':!huggingface' ':!packages'` is empty, and #72 records the same check.
- The tools that left the site left earlier: the credential audit dashboard and the Audit Toolkit pages on 2026-04-29 (`f9169df`), the demo dashboard and pricing components on 2026-10-02 (#67).
- The tools that arrived with the move (macOS privacy kit, icon pack, Hugging Face placeholders) came in as folders and were never put on the site.

[I] The move may still feel like the moment things went missing, because it is when everything became visible in one place. But the record shows two earlier cleanups, each a deliberate decision.

## Timeline

### Before the project (November 2025)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2025-11-08 | `macos-privacy` starts as a personal privacy dev-setup toolkit (install script, auth-plugin audit, iPad add-on). Not Secure Pride branded at the time | C `0075fab` (in `packages/macos-privacy/`) | [V] |

### Era 1: Founding, instructions first (January 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-01-11 | First commit: Copilot instructions and contributing docs. The project begins as a governance document | C `acad9c7` | [V] |
| 2026-01-11 | D-001: launch plan for the landing page, after buying `securepride.org` through Cloudflare's registrar. Goals: zero telemetry, accessible, low maintenance | `docs/decisions/DECISION-001.md` | [V] |
| 2026-01-14 | README links securepride.org | C `c76bd98` | [V] |
| 2026-01-23 | First AI-agent commits (Copilot agent fixes) | #1 | [V] |

### Era 2: Brand, bundles and prototypes (February to April 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-02-27 | CLAUDE.md added; Claude Code becomes a working tool here | C `bbf1e70` | [V] |
| 2026-03-08 | Document engine, trust prototype, landing bundle, brand assets | C `74824ec` | [V] |
| 2026-03-12 | Audit Toolkit landing, document engine and org ops bundles | C `5a2a622` | [V] |
| 2026-03-11 → 03-20 | D-002 brand identity; vector identity v1.0, the brass heart-lock shield | `docs/decisions/DECISION-002.md`, #2, #4 | [V] |
| 2026-03-22 | Apache 2.0 licence | C `c8cb89d` | [V] |
| 2026-03-26 | Frozen component contracts and content-validation CI | C `fe5aace`, `df5730f` | [V] |
| 2026-04-10 | First Cloudflare Pages config | C `47a8176` | [V] |
| 2026-04-13 → 04-26 | Hugging Face Space site prototype with three "under construction" tool pages (Certificate Audit, Smart Form Filler, Security Posture Check) | `huggingface/` history | [V] |
| 2026-04-15 | Landing bundle becomes an Astro project | #8 | [V] |
| 2026-04-22 | Kintsugi design system handed off from Claude Design (new private repo) | `secure-pride-design` C `31decd2` | [V] |
| 2026-04-29 | **Shift 1.** Hand-coded HTML replaced by the Astro build; credential audit mock dashboard and Audit Toolkit pages dropped | C `f9169df` | [V] |

### Era 3: The scanner becomes the product (May to July 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-05-02 | Python `secure-pride-dlp` prototype design and plan written (in a workspace container repo, later purged as a policy violation; preserved 2026-07-18) | `docs/history/README.md`, #32 | [V] |
| 2026-05-02 | **Shift 2 begins.** #12 proposes a live scanner in place of the mock audit feed; closed unmerged | #12 | [V] |
| 2026-05-09 | Document engine at `/tools/document-engine` (never linked from nav, then or now) | #14 | [V] |
| 2026-05-09 | Repo hygiene: sensitive files untracked | #13 | [V] |
| 2026-06-03 | Contact form email delivery (D-003) | #19 | [V] |
| 2026-06-06 | **Shift 2 lands.** AI Safety Scanner live, TypeScript DLP engine | #21 / C `395565b` | [V] |
| 2026-07-18 → 07-20 | Scanner-series D-001: audit logging restored to the scanner | #31 | [V] |
| 2026-07-18 | Scanner-series D-002: real evasion gaps confirmed and deferred to their own pass | `decisions/DECISION-002.md` | [V] |
| 2026-07-30 | D-005: Copilot instructions and the Mindful Development Charter merged into one document (v3.0) | `docs/decisions/DECISION-005.md` | [V] |

### Era 4: Honesty, reskin and the Rust rewrite (August to September 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-08-13 | Docker release workflow repaired (D-004) | #42 | [V] |
| 2026-08-13 → 08-14 | Consolidation journal, phases 1 to 5: how four repos could read as one offer to funders. Paused once for the Stele workstream | `docs/journal/`, C `eec54c3` | [V] |
| 2026-08-14 | Kintsugi reskin of the site | #44 | [V] |
| 2026-08-14 → 08-15 | **Shift 3.** README reframed; honest-maturity copy, pricing tier becomes "Join the pilot" | #47, C `cdb1336` | [V] |
| 2026-08-20 → 08-21 | **Shift 4.** Rust/WASM scanner core, fail-closed (scanner-series D-003). Built but not routed: Pages Functions cannot run `workers-rs` handlers | #49 | [V] |
| 2026-08-24 | Scanner page rebuilt in the kintsugi system | #50 | [V] |
| 2026-09-11 | Design repo finishes the kintsugi V2 migration (last design-repo commit) | `secure-pride-design` #3, #4, #6 | [V] |
| 2026-09-16 | Docker image hardened; brand system moved off the V1 neon palette; Stele case study drafted | #58, #59, #60 | [V] |

### Era 5: Grounding and reorganising (October 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-10-02 | **Shift 5.** Site grounded in people and shipped tools; scanner limits published; demo dashboard, pricing and other marketing components removed (D-006) | #67 | [V] |
| 2026-10-10 | D-008: kintsugi porcelain design proposed | `docs/decisions/DECISION-008.md` | [V] |
| 2026-10-11 → 10-12 | Wi-Fi Enterprise (802.1X) field guide (D-007) | #69 | [V] |
| 2026-10-14 | D-009: security policy adopted with graded controls; Tier 3 items await founder sign-off. Scanner limits table tested (against the TypeScript engine) | `docs/decisions/DECISION-009.md` | [V] |
| 2026-10-21 | D-010: heraldic heart-lock shield is the canonical mark | C `392eb51` | [V] |
| 2026-10-21 | **Shift 6.** Org move and monorepo: HF profile, macos-privacy and icons absorbed with history; `secure-pride-design` stays separate and private; `wireshark-beginner-kit` held back | #72, C `22d0690` | [V] |
| 2026-10-22 | **Shift 7.** Threat model at the centre of the site (D-011); public-repo hardening baseline | #90, #75 | [V] |
| 2026-10-22 | Content-Security-Policy served (D-012). **Last Cloudflare Pages deployment** | #92 / C `fd5e69d`; Pages deployments | [V] |

### Era 6: Rust in production, Workers, funding (November 2026)

| Date | Event | Evidence | Basis |
|---|---|---|---|
| 2026-11-08 → 11-09 | D-013: Rust scanner wired to `/api/scan`; D-014: scanner page in porcelain and charcoal. In `main`, but Pages no longer deploys, so not yet live | #100 / C `567c30e` | [V] |
| 2026-11-10 → 11-12 | **Shift 8.** D-015: serve the site from a Worker | #108 | [V] |
| 2026-11-13 | First Worker upload; production gets the Rust engine | Worker deployment record | [V] |
| 2026-11-14 | Worker URL restrictions and edge hardening | #110 | [V] |
| 2026-11-16 → 11-21 | Base44 accelerator application and ops-desk spec drafted; not submitted; build blocked at sign-in | #117 | [V] |
| 2026-11-23 | D-016: public API, audit salt and security.txt hardened; Worker version `dc7976d7` live | #109 | [V] |
| 2026-11-25 | Review finds live copy still saying the Rust scanner is "not deployed"; fix opened | #122 (open) | [V] |

## Patterns across the record

- [V] **The scanner is the through-line.** Every era after April touches it: prototype (May), TypeScript (June), audit logging and adversarial findings (July), Rust (August), production (November).
- [V] **Honesty passes recur.** August 14 and October 2 each pulled the site back to what had shipped. The November 25 review found the reverse problem: the site under-claiming a tool that had shipped.
- [V] **Hosting lagged code twice.** Rust was built in August but blocked by Pages Functions; routed on November 8 but blocked by Pages no longer deploying. Each gap was closed by changing the platform, not the code.
- [V] **Governance came first.** The first commit is an instruction document, and decision records appear from day one.
- [I] **Agents do much of the typing, the founder makes the calls.** Claude, Cursor Agent, Copilot and CodeRabbit appear as commit authors, and from D-011 on every decision record names the founder's direction.

## Open questions

1. **Why the monorepo?** Answered by the founder on 2026-11-25 (see shift 6). Not yet recorded in a decision record; #72 is the only artifact.
2. **Why did Pages stop deploying after 2026-10-22?** D-015 records that Pages builds could not be read (HTTP 403). The build logs were not available.
3. **Floor Up reader.** No source found on GitHub.
4. **Two decision-record series collide.** `decisions/DECISION-001` to `003` (scanner, July to August) and `docs/decisions/DECISION-001` to `016` share numbers 001 to 003.
5. **Unread repos.** `demo-repository`, `wireshark-beginner-kit` and the purged `projects-workspace` history may hold earlier events.
6. **Before January 2026.** The domain purchase date and any pre-repo planning are not in the record.
7. **Rollback target is stale.** D-015's rollback (Pages) would serve the October 22 TypeScript engine.
