## Decision: Rewrite the AI Safety Scanner core in Rust/WASM, fail-closed by construction

**Date**: 2026-08-20
**Category**: Security | Architecture
**Decision ID**: DECISION-003

### Context

DECISION-002 (2026-07-18) catalogued real, confirmed evasion and false-positive
gaps in the TypeScript detection engine (`functions/_lib/dlp/`): zero-width
space injection, Cyrillic homoglyphs, fullwidth `＠`, paraphrase, and
credit-card/SSN false positives/negatives — all bypassing to a silent `PASS`.
It deferred hardening to "its own pass" rather than bundling a redesign into
the audit-logging fix. This is that pass.

A build spec (`prompt-scanner-rust-respec.md`) was provided calling for a full
rewrite: Rust core compiled to WebAssembly on Cloudflare Workers via
`workers-rs`, a normalization layer, a deterministic regex/rules engine, a
separately versioned semantic classifier, a fail-closed policy orchestrator
where `PASS` is structurally unreachable without full stage coverage, and
Promptfoo-gated CI. The core insight — `PASS` should be a state the code has
to earn, not a default — directly targets the root cause of DECISION-002's
findings: the TS engine had no coverage concept at all, so any pattern miss
silently fell through to unrestricted `PASS`.

Three things in the respec don't map cleanly onto this repo's actual state
and needed a call before writing code:

1. **Deployment target.** This site runs on Cloudflare **Pages** with Pages
   Functions (`wrangler.toml` has `pages_build_output_dir`, no Workers route).
   The respec assumes a standalone Workers deployment. Pages Functions do not
   support `workers-rs` handlers directly.
2. **Semantic classifier.** The respec offers two equal-weight options: ONNX
   via `tract`, or hand-rolled. No trained model exists for this project —
   ONNX is not actually available to build against right now.
3. **Live cutover.** The respec's own deployment steps (§8) require staging
   deploy, a full Promptfoo run against staging, and only then production
   promotion. This session has no Cloudflare credentials — deploying is
   Tier 3 (external system access) and out of scope regardless of the rest.

### Options Considered

**Deployment integration**

- *(A) Migrate the whole site off Pages onto Workers* — matches the respec
  most literally, but is a much larger, unrelated blast radius (every route,
  every existing Pages Function, `_headers`/`_redirects` behavior) for a
  scanner rewrite. Rejected — disproportionate risk for this task.
- *(B) Standalone Worker (`scanner-rs/`), Pages Function becomes a thin proxy
  once staged and verified* — keeps the Pages app's existing routes,
  `_headers`, and every unrelated function untouched. The new Worker is
  independently deployable and rollback-able (Wrangler version aliasing,
  per respec §8) without touching the Pages deployment at all. **Chosen.**

**Semantic classifier**

- *(A) Block this pass on building/training an ONNX model* — no such model
  exists, no labeled corpus exists to train one, and doing this properly is
  its own multi-week project. Blocking here means the deterministic core
  (which fixes 5 of 6 DECISION-002 findings on its own) waits on the hardest,
  least-scoped part of the whole respec.
- *(B) Ship a hand-rolled Rust heuristic layer now — typo-tolerant keyword
  matching, multilingual override-intent lists, self-concealment phrase
  sets — versioned and clearly labeled non-ML, with `coverage.semantic` only
  true when it actually ran* — the respec explicitly names "hand-rolled" as
  an acceptable alternative (§1, §3 crate table). **Chosen** as the v1
  semantic stage; ONNX/`tract` remains the documented target for a future
  pass once a labeled corpus and training pipeline exist.

**Cutover sequencing**

- *(A) Wire `functions/api/scan.ts` to call the new Worker immediately* —
  rejected: the Worker has never been deployed or run against the fixture
  suite in a real Workers runtime (only `cargo test` locally). Flipping the
  live, public scanner route to unverified code contradicts the fail-closed
  philosophy the rewrite exists to enforce.
- *(B) Build and locally verify the full Rust workspace in this pass; leave
  the live route untouched; document staging deploy + Promptfoo run as the
  explicit next step before cutover.* **Chosen.**

### Decision

Build `scanner-rs/` as a standalone Cargo workspace (core, rules, semantic,
worker crates) implementing the respec's normalization → rules → semantic →
policy pipeline and JSON contract, with the fail-closed `decide()` function
carried over verbatim (`PASS` requires `coverage.normalization &&
coverage.rules && coverage.semantic` and zero findings). Semantic v1 is
hand-rolled Rust, not ONNX. The existing TypeScript scanner and its live
`/api/scan` route are **not modified or cut over** in this pass — they keep
serving traffic under their current (documented, gap-flagged) behavior until
the new Worker has been deployed to staging and passed the fixture suite
there, per the respec's own §8 ordering.

### Rationale

- **Alignment with Secure Pride values**: fail-closed-by-construction is a
  direct, structural fix for a tool that processes exactly the kind of
  sensitive input (SOGI-adjacent PII, credentials, prompt content) this
  project treats as high-risk by default. No new telemetry — audit logging
  design from DECISION-001 carries forward unchanged in spirit (hashed
  actor id, structured JSON, no raw text/PII ever logged).
- **Trade-offs accepted**: the semantic stage is a heuristic v1, not the ML
  classifier the respec envisions long-term — it will have lower recall on
  true paraphrase attacks than a real semantic model would. This is
  disclosed in code (`scanner-semantic/src/lib.rs` module doc) and tracked
  as follow-up, not silently substituted.
- **Risks mitigated**: the live scanner keeps running on the known-gapped
  but *known* TS engine until the new engine is actually verified in a real
  Workers runtime — swapping to untested code under time pressure is exactly
  the kind of shortcut that produces the next DECISION-002.
- **Success criteria**: `cargo test --workspace` and
  `cargo build --target wasm32-unknown-unknown --release` both succeed; all
  four DECISION-002 regression fixtures (zero-width, homoglyph, multilingual
  override, self-concealment) resolve to non-`Pass`; unit test asserts `Pass`
  is unreachable without full coverage.

### Implementation Plan

1. Scaffold `scanner-rs/` workspace (`scanner-core`, `scanner-rules`,
   `scanner-semantic`, `scanner-worker`).
2. `scanner-core::normalize` — NFKC, zero-width stripping, confusable
   skeleton folding, entity decode, bounded recursive base64/hex/url decode.
3. `scanner-rules` — port `patterns.ts`/`pii.ts` regex sets, add Luhn
   validation and broadened separator tolerance for credit cards, add
   multilingual override-intent seed patterns.
4. `scanner-core::policy::decide` — verbatim port of respec §5.
5. `scanner-semantic` — hand-rolled v1 heuristic classifier, versioned
   independently (`Versions.semantic_model` names it e.g. `"heuristic-v1"`).
6. Serde data contracts per respec §4.
7. `scanner-worker` — `workers-rs` HTTP entrypoint + its own `wrangler.toml`.
8. `fixtures/` covering the four DECISION-002 regressions plus core
   injection/PII/credential/exfil cases, wired as `cargo test`.
9. `.github/workflows/scanner-ci.yml` — `cargo test` + wasm build on every
   PR; Promptfoo/staging steps included but documented as needing Cloudflare
   secrets this session cannot provision.
10. Verify locally (`cargo test --workspace`,
    `cargo build --target wasm32-unknown-unknown --release`) before push.

### Outcome (updated later)

Implemented per plan above in this same change. A later pass,
`docs/decisions/DECISION-013.md`, puts this engine on the public
`/api/scan` route as WASM inside the existing Pages Function. A separate
Worker hostname is still not deployed.
