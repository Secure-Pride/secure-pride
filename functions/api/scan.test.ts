import { afterEach, describe, expect, it, vi } from "vitest";
import { hashActor } from "../_lib/dlp/audit.js";
import { API_SECURITY_HEADERS } from "../_lib/http/api-headers.js";
import { MAX_SCAN_BODY_BYTES } from "../_lib/http/request-body.js";

vi.mock("../_lib/scanner/runtime.js", () => ({
  scanJson: vi.fn(async () =>
    JSON.stringify({
      blocked: false,
      action: "log_only",
      injection_count: 0,
      injections: [],
      pii_count: 0,
      pii_matches: [],
      policy_violations: [],
      engine: "scanner-rs",
      versions: { rules: "rules-v1", semantic_model: "heuristic-v1" },
    }),
  ),
}));

import { onRequestPost, PUBLIC_SCAN_ACTOR_ID } from "./scan.js";
import { scanJson } from "../_lib/scanner/runtime.js";

const scanJsonMock = vi.mocked(scanJson);

function context(request: Request, env: { SP_AUDIT_SALT?: string } = {}) {
  return {
    request,
    env,
    waitUntil() {},
    passThroughOnException() {},
    next: async () => new Response("not found", { status: 404 }),
    params: {},
    data: {},
    functionPath: "/api/scan",
  };
}

function post(body: string, headers: HeadersInit = {}): Request {
  return new Request("https://securepride.org/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("POST /api/scan", () => {
  afterEach(() => {
    scanJsonMock.mockClear();
  });

  it("ignores a client-supplied actor_id and still scans without a salt", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const payload = JSON.stringify({ text: "hello world", actor_id: "attacker@example.com" });
      const response = await onRequestPost(context(post(payload)) as never);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { engine: string };
      expect(body.engine).toBe("scanner-rs");
      expect(scanJsonMock).toHaveBeenCalledWith("hello world");
      expect(log).not.toHaveBeenCalled();
      expect(PUBLIC_SCAN_ACTOR_ID).toBe("anonymous");
      for (const [key, value] of Object.entries(API_SECURITY_HEADERS)) {
        expect(response.headers.get(key)).toBe(value);
      }
    } finally {
      log.mockRestore();
    }
  });

  it("hashes only the anonymous actor when a salt is set", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const payload = JSON.stringify({ text: "hello world", actor_id: "attacker@example.com" });
      const response = await onRequestPost(
        context(post(payload), { SP_AUDIT_SALT: "production-salt" }) as never,
      );
      expect(response.status).toBe(200);
      expect(log).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(log.mock.calls[0][0] as string) as { actor_hash: string };
      expect(logged.actor_hash).toMatch(/^[0-9a-f]{16}$/);
      expect(logged.actor_hash).toBe(await hashActor(PUBLIC_SCAN_ACTOR_ID, "production-salt"));
      const raw = log.mock.calls[0][0] as string;
      expect(raw).not.toContain("attacker");
      expect(raw).not.toContain("example.com");
    } finally {
      log.mockRestore();
    }
  });

  it("returns 413 when Content-Length is over the cap, before parsing JSON", async () => {
    const request = new Request("https://securepride.org/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(MAX_SCAN_BODY_BYTES + 1),
      },
    });
    const response = await onRequestPost(context(request) as never);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ detail: "Request body is too large" });
    expect(scanJsonMock).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 400 for invalid JSON under the cap", async () => {
    const response = await onRequestPost(context(post("{not json")) as never);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ detail: "Invalid JSON body" });
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
