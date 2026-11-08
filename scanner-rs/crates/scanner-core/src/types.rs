//! Data contracts shared across the scanner pipeline.
//! Field shapes follow `prompt-scanner-rust-respec.md` section 4 verbatim,
//! with `snake_case` JSON so the wire format matches the existing scanner API.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Decision {
    Pass,
    Warn,
    Block,
    RequireReview,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ScanRequest {
    pub text: String,
    #[serde(default)]
    pub context: Option<ScanContext>,
    #[serde(default)]
    pub options: Option<ScanOptions>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct ScanContext {
    #[serde(default)]
    pub channel: Option<String>, // web | cli | api | editor
    #[serde(default)]
    pub content_type: Option<String>, // plain | markdown | html | json | mixed
    #[serde(default)]
    pub locale_hint: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct ScanOptions {
    #[serde(default)]
    pub redact: Option<bool>,
    #[serde(default)]
    pub max_decode_depth: Option<u8>,
    #[serde(default)]
    pub return_offsets: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScanResponse {
    pub decision: Decision,
    pub confidence: f32,
    pub coverage: Coverage,
    pub scores: HashMap<String, i32>,
    pub findings: Vec<Finding>,
    pub redacted_text: Option<String>,
    pub versions: Versions,
}

#[derive(Debug, Clone, Copy, Serialize)]
pub struct Coverage {
    pub normalization: bool,
    pub rules: bool,
    pub semantic: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Finding {
    pub id: String,
    pub severity: Severity,
    pub span: Option<(usize, usize)>,
    pub evidence: Option<String>,
    pub normalized_evidence: Option<String>,
    /// Static explanation safe to show a person. Never the raw match.
    pub description: String,
    pub action: Decision,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Versions {
    pub rules: String,
    pub semantic_model: Option<String>,
}

pub const RULES_VERSION: &str = "rules-v1";
/// Hand-rolled heuristic classifier, not the ONNX/`tract` model the respec
/// targets long-term — see DECISION-003. Named distinctly so telemetry can
/// tell the two apart once a real model replaces this.
pub const SEMANTIC_MODEL_VERSION: &str = "heuristic-v1";

pub const MAX_INPUT_LENGTH: usize = 50_000;
pub const DEFAULT_MAX_DECODE_DEPTH: u8 = 3;
