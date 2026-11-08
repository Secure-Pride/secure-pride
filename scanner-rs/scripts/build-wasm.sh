#!/usr/bin/env bash
# Rebuild the WASM module the Pages Function imports.
# Commit functions/_lib/scanner/pkg after running this.
# Scanner CI runs this script and fails if the package differs.
# rust-toolchain.toml pins the compiler that produced the committed wasm.
set -euo pipefail
cd "$(dirname "$0")/.."
BINDGEN_VERSION="0.2.129"
if ! command -v wasm-bindgen >/dev/null 2>&1 || [[ "$(wasm-bindgen --version)" != *"${BINDGEN_VERSION}"* ]]; then
  cargo install wasm-bindgen-cli --version "${BINDGEN_VERSION}" --locked
fi
cargo build -p scanner-wasm --target wasm32-unknown-unknown --release
OUT="$(cd .. && pwd)/functions/_lib/scanner/pkg"
rm -rf "${OUT}"
mkdir -p "${OUT}"
# `web` glue instantiates an imported WebAssembly.Module. Wrangler does
# that; the bundler target expects the bundler to call the start export.
wasm-bindgen --target web --out-dir "${OUT}" \
  target/wasm32-unknown-unknown/release/scanner_wasm.wasm
# Pages compiles every .ts under functions/. The bindgen declarations are
# types only, and esbuild tries to execute them.
find "${OUT}" -name '*.d.ts' -delete
