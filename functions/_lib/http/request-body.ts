/** Character cap applied after JSON parse, in JavaScript string length. */
const MAX_SCAN_TEXT_CHARS = 50_000;

/**
 * Longest JSON.stringify encoding of one JavaScript character.
 * A control character becomes \u00XX (6 bytes). A CJK character is 3 UTF-8 bytes.
 */
const MAX_JSON_BYTES_PER_CHAR = 6;

/** Bytes in {"text":"","actor_id":"anonymous"}, the envelope the public page sends. */
const SCAN_JSON_ENVELOPE_BYTES = new TextEncoder().encode(
  JSON.stringify({ text: "", actor_id: "anonymous" }),
).byteLength;

/**
 * Maximum accepted POST body for /api/scan, in bytes.
 * Fits a 50,000-character draft in its longest JSON.stringify form, plus the
 * public envelope. A larger body is rejected before JSON.parse.
 * See DECISION-016 and DECISION-013.
 */
export const MAX_SCAN_BODY_BYTES =
  MAX_SCAN_TEXT_CHARS * MAX_JSON_BYTES_PER_CHAR + SCAN_JSON_ENVELOPE_BYTES;

export type CappedBody =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 413 };

function declaredLength(request: Request): number | null {
  const raw = request.headers.get("Content-Length");
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

/**
 * Read a request body with a hard byte cap.
 *
 * If Content-Length is present and larger than the cap, return 413 without
 * reading. If Content-Length is missing (chunked or otherwise), or present
 * and within the cap, read from the stream and stop at the cap so a
 * misstated length cannot grow without bound.
 */
export async function readBodyCapped(
  request: Request,
  maxBytes: number = MAX_SCAN_BODY_BYTES,
): Promise<CappedBody> {
  const declared = declaredLength(request);
  if (declared !== null && declared > maxBytes) {
    return { ok: false, status: 413 };
  }

  const body = request.body;
  if (!body) {
    return { ok: true, bytes: new Uint8Array(0) };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export function decodeBodyUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}
