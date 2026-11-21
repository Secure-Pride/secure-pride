import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashActor, logScan } from "./audit.js";
import { DataClassification, ScanAction, Severity } from "./types.js";

const baseParams = {
  traceId: "trace-1",
  actorId: "user@org.com",
  classificationsFound: [DataClassification.PII],
  injectionDetected: false,
  maxSeverity: null,
  policyAction: ScanAction.MASK_AND_ALLOW,
  piiTypesFound: ["email"],
  inputLength: 42,
  blocked: false,
};

describe("hashActor", () => {
  it("is deterministic for the same actor and salt", async () => {
    const a = await hashActor("user@org.com", "salt-1");
    const b = await hashActor("user@org.com", "salt-1");
    expect(a).toBe(b);
  });

  it("differs for different actors with the same salt", async () => {
    const a = await hashActor("user-a@org.com", "salt-1");
    const b = await hashActor("user-b@org.com", "salt-1");
    expect(a).not.toBe(b);
  });

  it("differs for the same actor with different salts", async () => {
    const a = await hashActor("user@org.com", "salt-1");
    const b = await hashActor("user@org.com", "salt-2");
    expect(a).not.toBe(b);
  });

  it("never contains the raw actor id as a substring", async () => {
    const hash = await hashActor("jane.doe@example.com", "salt-1");
    expect(hash).not.toContain("jane.doe");
    expect(hash).not.toContain("example.com");
  });

  it("returns a 16-character lowercase hex string", async () => {
    const hash = await hashActor("anonymous", "salt-1");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("requires a salt and has no default fallback", async () => {
    await expect(hashActor("user@org.com", "")).rejects.toThrow(/salt/i);
  });
});

describe("logScan", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("emits exactly one console.log line when a salt is provided", async () => {
    const entry = await logScan({ ...baseParams, salt: "salt-1" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(entry?.actor_hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("writes nothing when the salt is missing", async () => {
    const entry = await logScan({ ...baseParams });
    expect(entry).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("writes nothing when the salt is blank", async () => {
    const entry = await logScan({ ...baseParams, salt: "   " });
    expect(entry).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("produces valid JSON matching the original schema field-for-field", async () => {
    await logScan({
      traceId: "trace-2",
      actorId: "user@org.com",
      classificationsFound: [DataClassification.CREDENTIAL],
      injectionDetected: true,
      maxSeverity: Severity.CRITICAL,
      policyAction: ScanAction.BLOCK,
      piiTypesFound: ["aws_key"],
      inputLength: 128,
      blocked: true,
      salt: "salt-1",
    });
    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);

    expect(logged).toMatchObject({
      trace_id: "trace-2",
      action: "dlp_scan",
      classifications_found: ["credential"],
      injection_detected: true,
      max_severity: "critical",
      policy_action: "block",
      pii_types_found: ["aws_key"],
      input_length: 128,
      blocked: true,
    });
    expect(logged.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(logged.actor_hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("never logs the raw actor id", async () => {
    await logScan({
      ...baseParams,
      traceId: "trace-3",
      actorId: "jane.doe@example.com",
      classificationsFound: [],
      policyAction: ScanAction.LOG_ONLY,
      piiTypesFound: [],
      inputLength: 10,
      salt: "salt-1",
    });
    const raw = logSpy.mock.calls[0][0] as string;
    expect(raw).not.toContain("jane.doe");
    expect(raw).not.toContain("example.com");
  });

  it("respects a custom salt", async () => {
    await logScan({
      ...baseParams,
      traceId: "trace-4",
      classificationsFound: [],
      policyAction: ScanAction.LOG_ONLY,
      piiTypesFound: [],
      inputLength: 5,
      salt: "custom-salt",
    });
    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
    const expected = await hashActor("user@org.com", "custom-salt");
    expect(logged.actor_hash).toBe(expected);
  });
});
