import { describe, expect, it } from "vitest";
import { MAX_SCAN_BODY_BYTES, readBodyCapped } from "./request-body.js";

function requestWithLength(body: BodyInit | null, length: string | null, extra: HeadersInit = {}): Request {
  const headers = new Headers(extra);
  if (length !== null) headers.set("Content-Length", length);
  // Request may overwrite Content-Length from the body; build a fake Request-like
  // object only when we need a mismatch. For normal cases, use Request.
  return new Request("https://securepride.org/api/scan", {
    method: "POST",
    headers,
    body,
  });
}

describe("MAX_SCAN_BODY_BYTES", () => {
  it("fits a 50,000-character CJK draft and the longest JSON.stringify form", () => {
    const cjk = JSON.stringify({ text: "字".repeat(50_000), actor_id: "anonymous" });
    const worst = JSON.stringify({ text: "\u0001".repeat(50_000), actor_id: "anonymous" });
    const cjkBytes = new TextEncoder().encode(cjk).byteLength;
    const worstBytes = new TextEncoder().encode(worst).byteLength;
    expect(cjkBytes).toBeGreaterThan(100 * 1024);
    expect(cjkBytes).toBeLessThanOrEqual(MAX_SCAN_BODY_BYTES);
    expect(worstBytes).toBe(MAX_SCAN_BODY_BYTES);
  });
});

describe("readBodyCapped", () => {
  it("accepts a small JSON body with Content-Length", async () => {
    const payload = '{"text":"hello"}';
    const result = await readBodyCapped(
      requestWithLength(payload, String(payload.length), { "Content-Type": "application/json" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(new TextDecoder().decode(result.bytes)).toBe(payload);
    }
  });

  it("returns 413 when Content-Length is larger than the cap, without needing the body", async () => {
    const request = new Request("https://securepride.org/api/scan", {
      method: "POST",
      headers: { "Content-Length": String(MAX_SCAN_BODY_BYTES + 1) },
    });
    const result = await readBodyCapped(request);
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it("returns 413 when a chunked body (no Content-Length) exceeds the cap", async () => {
    const max = 16;
    let chunksSent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksSent += 1;
        controller.enqueue(new Uint8Array(10).fill(65));
        if (chunksSent >= 3) controller.close();
      },
    });
    const request = new Request("https://securepride.org/api/scan", {
      method: "POST",
      body: stream,
      // @ts-expect-error duplex is required for streaming request bodies in some runtimes
      duplex: "half",
    });
    // Ensure we are not advertising a safe Content-Length.
    request.headers.delete("Content-Length");
    const result = await readBodyCapped(request, max);
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it("accepts a chunked body under the cap", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"text":'));
        controller.enqueue(new TextEncoder().encode('"ok"}'));
        controller.close();
      },
    });
    const request = new Request("https://securepride.org/api/scan", {
      method: "POST",
      body: stream,
      // @ts-expect-error duplex is required for streaming request bodies in some runtimes
      duplex: "half",
    });
    request.headers.delete("Content-Length");
    const result = await readBodyCapped(request, 100);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(new TextDecoder().decode(result.bytes)).toBe('{"text":"ok"}');
    }
  });
});
