//! WASM export loaded by the Pages Function at `functions/api/scan.ts`.
//! The Workers `fetch` handler stays in `scanner-worker` for a dedicated
//! route; this crate is the one the public site ships.

use scanner_engine::scan_public_json;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn scan_json(text: &str) -> String {
    scan_public_json(text)
}
