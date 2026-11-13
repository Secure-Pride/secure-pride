/** Maximum accepted POST body for /api/scan, in bytes (100 KiB). */
export const MAX_SCAN_BODY_BYTES = 100 * 1024;

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
