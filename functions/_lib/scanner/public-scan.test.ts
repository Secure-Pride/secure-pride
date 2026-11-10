import { describe, expect, it } from "vitest";
import { parsePublicScan } from "./public-scan.js";

const pass = {
  blocked: false,
  action: "log_only",
  injection_count: 0,
  injections: [],
  pii_count: 0,
  pii_matches: [],
  policy_violations: [],
  engine: "scanner-rs",
  versions: { rules: "rules-v1", semantic_model: "heuristic-v1" },
};

describe("parsePublicScan", () => {
  it("accepts a clean engine response", () => {
    expect(parsePublicScan(pass)?.action).toBe("log_only");
  });

  it("rejects a response that claims a pass without the engine name", () => {
    expect(parsePublicScan({ ...pass, engine: "typescript" })).toBeNull();
  });

  it("rejects a block that is not marked blocked", () => {
    expect(parsePublicScan({ ...pass, action: "block", blocked: false })).toBeNull();
  });

  it("rejects mask_and_allow without a draft", () => {
    expect(parsePublicScan({ ...pass, action: "mask_and_allow" })).toBeNull();
  });

  it("accepts a missing or null semantic model and rejects a non-string", () => {
    const { semantic_model: _dropped, ...versions } = pass.versions;
    expect(parsePublicScan({ ...pass, versions })?.action).toBe("log_only");
    expect(parsePublicScan({ ...pass, versions: { ...pass.versions, semantic_model: null } })?.action).toBe(
      "log_only",
    );
    expect(parsePublicScan({ ...pass, versions: { ...pass.versions, semantic_model: 1 } })).toBeNull();
  });
});
