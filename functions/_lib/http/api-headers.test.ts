import { describe, expect, it } from "vitest";
import { API_SECURITY_HEADERS, jsonError, withApiHeaders } from "./api-headers.js";
import { onRequest } from "../../api/_middleware.js";

describe("withApiHeaders", () => {
  it("sets the required headers on a JSON response", async () => {
    const response = withApiHeaders(Response.json({ ok: true }, { status: 200 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    for (const [key, value] of Object.entries(API_SECURITY_HEADERS)) {
      expect(response.headers.get(key)).toBe(value);
    }
  });

  it("replaces a prior Cache-Control value", () => {
    const response = withApiHeaders(
      new Response("x", { headers: { "Cache-Control": "public, max-age=60" } }),
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("keeps status on error responses", async () => {
    const response = jsonError("Request body is too large", 413);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ detail: "Request body is too large" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
  });
});

describe("api middleware", () => {
  it("applies headers to a 404 from next()", async () => {
    const context = {
      next: async () => new Response("Not found", { status: 404, headers: { "Content-Type": "text/html" } }),
    };
    const response = await onRequest(context as never);
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
  });

  it("applies headers to a 405 from next()", async () => {
    const context = {
      next: async () => new Response(null, { status: 405 }),
    };
    const response = await onRequest(context as never);
    expect(response.status).toBe(405);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
