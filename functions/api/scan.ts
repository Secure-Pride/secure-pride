import type { PagesFunction } from "@cloudflare/workers-types";
import { logScan } from "../_lib/dlp/audit.js";
import {
  DataClassification,
  ScanAction,
  Severity,
  type DataClassification as Classification,
} from "../_lib/dlp/types.js";
import { parsePublicScan, type PublicScan } from "../_lib/scanner/public-scan.js";
import { scanJson } from "../_lib/scanner/runtime.js";

interface ScanRequestBody {
  text?: unknown;
  actor_id?: unknown;
}

interface Env {
  SP_AUDIT_SALT?: string;
}

function classificationsOf(scan: PublicScan): Classification[] {
  const found = new Set<Classification>();
  for (const match of scan.pii_matches) {
    if (match.classification === "pci") found.add(DataClassification.PCI);
    else if (match.classification === "credential") found.add(DataClassification.CREDENTIAL);
    else found.add(DataClassification.PII);
  }
  return [...found];
}

function maxSeverity(scan: PublicScan): Severity | null {
  const rank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  let best: Severity | null = null;
  let bestRank = 0;
  for (const finding of scan.injections) {
    const next = rank[finding.severity] ?? 0;
    if (next > bestRank) {
      bestRank = next;
      best = finding.severity as Severity;
    }
  }
  return best;
}

function actionOf(scan: PublicScan): ScanAction {
  if (scan.action === "block") return ScanAction.BLOCK;
  if (scan.action === "mask_and_allow") return ScanAction.MASK_AND_ALLOW;
  return ScanAction.LOG_ONLY;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ScanRequestBody;

  try {
    body = (await context.request.json()) as ScanRequestBody;
  } catch {
    return Response.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.text !== "string" || body.text.length === 0) {
    return Response.json(
      { detail: "text must be a non-empty string" },
      { status: 400 }
    );
  }
  // JavaScript string length (UTF-16 code units). The Rust engine uses the same count.
  if (body.text.length > 50_000) {
    return Response.json(
      { detail: "Input exceeds maximum length of 50,000 characters" },
      { status: 400 }
    );
  }
  if (body.text.includes("\x00")) {
    return Response.json(
      { detail: "Input contains null bytes" },
      { status: 400 }
    );
  }

  let scan: PublicScan | null = null;
  try {
    scan = parsePublicScan(JSON.parse(await scanJson(body.text)));
  } catch {
    scan = null;
  }
  if (!scan) {
    return Response.json({ detail: "Scanner failed closed" }, { status: 500 });
  }

  const traceId = crypto.randomUUID();
  const actorId = typeof body.actor_id === "string" ? body.actor_id : "anonymous";
  await logScan({
    traceId,
    actorId,
    classificationsFound: classificationsOf(scan),
    injectionDetected: scan.injection_count > 0,
    maxSeverity: maxSeverity(scan),
    policyAction: actionOf(scan),
    piiTypesFound: scan.pii_matches.map((match) => match.pii_type),
    inputLength: body.text.length,
    blocked: scan.blocked,
    salt: context.env.SP_AUDIT_SALT,
  });

  return Response.json({
    trace_id: traceId,
    blocked: scan.blocked,
    action: scan.action,
    ...(scan.masked_text !== undefined && { masked_text: scan.masked_text }),
    injection_count: scan.injection_count,
    injections: scan.injections,
    pii_count: scan.pii_count,
    pii_matches: scan.pii_matches,
    policy_violations: scan.policy_violations,
    engine: scan.engine,
    versions: scan.versions,
  });
};
