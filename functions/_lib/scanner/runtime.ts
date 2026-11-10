import wasmModule from "./pkg/scanner_wasm_bg.wasm";
import init, { scan_json } from "./pkg/scanner_wasm.js";

let pending: Promise<void> | undefined;

/** Run the committed Rust scanner. Callers fail closed if this throws. */
export async function scanJson(text: string): Promise<string> {
  if (!pending) {
    pending = Promise.resolve(init({ module_or_path: wasmModule })).then(() => undefined);
  }
  try {
    await pending;
  } catch (error) {
    pending = undefined;
    throw error;
  }
  return scan_json(text);
}
