/**
 * The public `/api/scan` body, produced by the Rust engine and checked
 * again here so a bad module cannot be returned as a clean pass.
 * `trace_id` is added by the Pages Function, not the engine.
 */
export interface PublicScan {
  blocked: boolean;
  action: "block" | "mask_and_allow" | "log_only";
  masked_text?: string;
  injection_count: number;
  injections: {
    pattern_name: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
  }[];
  pii_count: number;
  pii_matches: { pii_type: string; classification: string; masked: string }[];
  policy_violations: string[];
  engine: string;
  versions: { rules: string; semantic_model?: string | null };
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const SEVERITIES = ["critical", "high", "medium", "low"];

export function parsePublicScan(value: unknown): PublicScan | null {
  if (
    !record(value) ||
    typeof value.blocked !== "boolean" ||
    !["block", "mask_and_allow", "log_only"].includes(String(value.action)) ||
    !Number.isInteger(value.injection_count) ||
    !Number.isInteger(value.pii_count) ||
    !Array.isArray(value.injections) ||
    !Array.isArray(value.pii_matches) ||
    !Array.isArray(value.policy_violations) ||
    !value.policy_violations.every((item) => typeof item === "string") ||
    value.injection_count !== value.injections.length ||
    value.pii_count !== value.pii_matches.length ||
    (value.masked_text !== undefined && typeof value.masked_text !== "string") ||
    value.engine !== "scanner-rs" ||
    !record(value.versions) ||
    typeof value.versions.rules !== "string" ||
    !value.injections.every(
      (item) =>
        record(item) &&
        typeof item.pattern_name === "string" &&
        typeof item.description === "string" &&
        SEVERITIES.includes(String(item.severity)),
    ) ||
    !value.pii_matches.every(
      (item) =>
        record(item) &&
        typeof item.pii_type === "string" &&
        typeof item.classification === "string" &&
        typeof item.masked === "string",
    ) ||
    value.blocked !== (value.action === "block") ||
    (value.action === "mask_and_allow" && typeof value.masked_text !== "string")
  ) {
    return null;
  }
  return value as unknown as PublicScan;
}
