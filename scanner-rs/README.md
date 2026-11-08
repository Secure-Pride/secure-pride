# scanner-rs

Rust/WASM rewrite of the AI Safety Scanner core, per
`decisions/DECISION-003.md`. Fail-closed by construction: `PASS` is
unreachable unless normalization, the rules engine, and the semantic
classifier all ran and found nothing (`scanner-core/src/policy.rs`).

## Status

The public `/api/scan` route runs this engine as WASM
(`scanner-wasm`, loaded by `functions/api/scan.ts`). See
`docs/decisions/DECISION-013.md`. The `scanner-worker` crate is still the
dedicated Workers entrypoint and is not deployed to its own hostname.

## Layout

- `crates/scanner-core` — normalization (NFKC, zero-width, confusables,
  bounded recursive decode), the fail-closed `decide()` policy, and the
  shared data contracts.
- `crates/scanner-rules` — deterministic regex rules (injection, PII,
  credentials, multilingual seeds), ported from `functions/_lib/dlp/`.
- `crates/scanner-semantic` — **v1 hand-rolled heuristic classifier, not
  ONNX.** Typo-tolerant multilingual override detection, self-concealment
  and indirect-instruction intent, fuzzy credential proximity. See the
  module doc comment for why this differs from the respec's long-term
  ONNX/`tract` target.
- `crates/scanner-worker` — `workers-rs` HTTP entrypoint and its own
  `wrangler.toml` (separate deployment from the site's Cloudflare Pages
  config, by design — see DECISION-003's deployment-integration rationale).
- `fixtures/` — regression corpus, including the four DECISION-002
  false-PASS cases (`unicode/`, `multilingual/`).

## Commands

```bash
cd scanner-rs
cargo test --workspace                                          # unit + fixture tests
bash scripts/build-wasm.sh                                      # refresh functions/_lib/scanner/pkg
cargo build --target wasm32-unknown-unknown --release -p scanner-worker
```

`scripts/build-wasm.sh` writes the module the Pages Function imports. Commit
`functions/_lib/scanner/pkg` with the source change. The site README holds
the current page snapshots.

Deploying requires `worker-build` and an authenticated `wrangler` — neither
was available in the environment this was built in, so staging deploy and
the Promptfoo eval (`.github/workflows/scanner-ci.yml`'s `promptfoo-eval`
job) are wired but not yet exercised. That job is gated behind a repo
variable (`SCANNER_STAGING_DEPLOY_ENABLED`) so it stays inert until someone
with Cloudflare deploy access provisions `CLOUDFLARE_API_TOKEN` /
`CLOUDFLARE_ACCOUNT_ID` and turns it on.
