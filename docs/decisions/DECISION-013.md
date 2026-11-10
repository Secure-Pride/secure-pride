# DECISION-013: Ship the Rust scanner on the public scan route

**Status**: Accepted — directed by the founder ("ship the rust scanner").
**Date**: 2026-11-08
**Category**: Security | Architecture
**Decision ID**: DECISION-013
**Authority**: Tier 2. Supersedes the cutover hold in `decisions/DECISION-003.md`.

## Context

`scanner-rs` already implements the fail-closed pipeline (normalize, rules, semantic heuristic, `decide()`). `/api/scan` still ran the TypeScript engine in `functions/_lib/dlp/`. DECISION-003 left that route alone until a staging Worker and a Promptfoo run existed. This session has no Cloudflare deploy credentials, so a new hostname (`scanner.securepride.org`) cannot be created here.

The public scanner is the Pages route people already call. Shipping means that route runs the Rust engine.

## Options

**A. Deploy `scanner-worker` to a new route and proxy from Pages.** Matches DECISION-003's standalone Worker. Requires an authenticated Wrangler deploy and DNS. Not possible in this session.

**B. Keep the TypeScript engine.** Leaves the known DECISION-002 gaps on the only route users can reach.

**C. Compile the Rust pipeline to WASM and call it from the existing Pages Function.** The site deploy already ships `functions/`. No new hostname, binding, or credential. The Worker crate stays available for a later dedicated route. **Chosen.**

## Decision

`functions/api/scan.ts` calls the Rust scanner through `functions/_lib/scanner/runtime.ts`. The module is built with `wasm-bindgen --target web` and committed under `functions/_lib/scanner/pkg/` so a Pages build does not need a Rust toolchain. Wrangler supplies the file as a `WebAssembly.Module`; the web glue instantiates it. The bundler target's start export does not run under Wrangler. Declaration files from bindgen are not committed, because Pages compiles every `.ts` file under `functions/`.

The JSON returned to the browser stays the contract `parseScanResponse` already checks (`blocked`, `action`, findings, optional `masked_text`), plus `engine: "scanner-rs"` and `versions`. A response that fails that check is HTTP 500. The UI already treats a non-OK response as "no result", which is not a clean pass.

The 50,000-character cap is JavaScript string length (UTF-16 code units) in the Pages route and in the engine. A draft under that cap is scanned even when its UTF-8 encoding is longer.

Scanner CI rebuilds `functions/_lib/scanner/pkg` with `scripts/build-wasm.sh` and fails if that package differs from the commit. The build remaps the cargo registry path, because panic locations otherwise embed `CARGO_HOME` and the bytes differ between a dev machine and the GitHub runner.

Audit logging stays in the Pages Function: hashed actor id, classifications, severity, length. Submitted text is not logged.

`require_review` (incomplete coverage) is not mapped to an empty pass. It stays unblocked only when findings are present for review, and coverage failure adds an explicit policy line.

## Rollback

Point `functions/api/scan.ts` back at `functions/_lib/dlp/engine.ts`. The TypeScript engine and its tests remain in the tree.

## Verification

- `cargo test --workspace` in `scanner-rs/`
- `npm test` (public-response parser)
- `POST /api/scan` for a clean line, an email, and "Ignore all previous instructions"
