import type { AuditEntry, DataClassification, ScanAction, Severity } from "./types.js";

/**
 * One-way hash of actor identity for the audit trail. Never stores raw
 * identity. Salt prevents rainbow-table attacks on common actor IDs.
 * Matches the original Python design (SHA-256, salted, truncated to 16 hex
 * chars), using Web Crypto's async digest because Workers/Pages Functions
 * do not have Node's synchronous `crypto` module.
 *
 * The salt is required. There is no built-in fallback; a public default
 * would make common actor IDs easy to confirm. See DECISION-016.
 */
export async function hashActor(actorId: string, salt: string): Promise<string> {
  if (!salt) {
    throw new Error("hashActor requires a salt");
  }
  const data = new TextEncoder().encode(`${salt}:${actorId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

export interface LogScanParams {
  traceId: string;
  actorId: string;
  classificationsFound: DataClassification[];
  injectionDetected: boolean;
  maxSeverity: Severity | null;
  policyAction: ScanAction;
  piiTypesFound: string[];
  inputLength: number;
  blocked: boolean;
  salt?: string;
}

/**
 * Log a DLP scan event when a production salt is configured.
 * Emits one structured JSON line via console.log. The line never includes
 * the submitted text. If `salt` is missing or blank, no line is written
 * and nothing identifying is logged. The scan itself still succeeds.
 */
export async function logScan(params: LogScanParams): Promise<AuditEntry | null> {
  const salt = params.salt?.trim();
  if (!salt) {
    return null;
  }

  const entry: AuditEntry = {
    trace_id: params.traceId,
    timestamp: new Date().toISOString(),
    actor_hash: await hashActor(params.actorId, salt),
    action: "dlp_scan",
    classifications_found: params.classificationsFound,
    injection_detected: params.injectionDetected,
    max_severity: params.maxSeverity,
    policy_action: params.policyAction,
    pii_types_found: params.piiTypesFound,
    input_length: params.inputLength,
    blocked: params.blocked,
  };

  console.log(JSON.stringify(entry));
  return entry;
}
