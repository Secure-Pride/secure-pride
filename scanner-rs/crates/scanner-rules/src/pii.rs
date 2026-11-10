//! PII/credential/PCI rule set. Ported from `functions/_lib/dlp/pii.ts`,
//! with a Luhn checksum gate and broadened separator tolerance on credit
//! cards per DECISION-002's remediation plan.

use once_cell::sync::Lazy;
use regex::Regex;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Category {
    Pii,
    Pci,
    Credential,
}

pub struct RawPiiMatch {
    pub pii_type: &'static str,
    pub category: Category,
    pub original: String,
    pub masked: String,
    pub start: usize,
    pub end: usize,
}

fn mask_email(m: &str) -> String {
    match m.find('@') {
        Some(at) => format!("{}***@{}", &m[..1], &m[at + 1..]),
        None => "[REDACTED_EMAIL]".to_string(),
    }
}

fn digits_only(s: &str) -> String {
    s.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn mask_phone(m: &str) -> String {
    let d = digits_only(m);
    let last4 = if d.len() >= 4 { &d[d.len() - 4..] } else { &d[..] };
    format!("***-***-{last4}")
}

fn mask_ssn(m: &str) -> String {
    let d = digits_only(m);
    let last4 = if d.len() >= 4 { &d[d.len() - 4..] } else { &d[..] };
    format!("***-**-{last4}")
}

fn mask_credit_card(m: &str) -> String {
    let d = digits_only(m);
    let last4 = if d.len() >= 4 { &d[d.len() - 4..] } else { &d[..] };
    format!("****-****-****-{last4}")
}

/// Standard Luhn checksum — used to cut credit-card false positives on
/// order/confirmation numbers that happen to match the digit-group shape
/// (DECISION-002).
fn passes_luhn(digits: &str) -> bool {
    let nums: Vec<u32> = digits.chars().rev().filter_map(|c| c.to_digit(10)).collect();
    if nums.len() < 12 {
        return false;
    }
    let sum: u32 = nums
        .iter()
        .enumerate()
        .map(|(i, &d)| {
            if i % 2 == 1 {
                let doubled = d * 2;
                if doubled > 9 { doubled - 9 } else { doubled }
            } else {
                d
            }
        })
        .sum();
    sum % 10 == 0
}

// Separator class widened beyond a single optional char to tolerate
// double spaces, bullets, and asterisks between digit groups.
const SEP: &str = r"[-.\s*•]{0,2}";

static EMAIL_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap());
static PHONE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\D|$)").unwrap());
static SSN_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b").unwrap());
static API_KEY_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?i)(?:sk|pk|api|key|token|secret|password)[-_](?:[a-zA-Z0-9]+[-_])*[a-zA-Z0-9]{16,}").unwrap());
static BEARER_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?i)Bearer\s+[a-zA-Z0-9\-._~+/]+=*").unwrap());
static AWS_KEY_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?:AKIA|ASIA)[A-Z0-9]{16}").unwrap());
static PRIVATE_KEY_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----").unwrap());
static CREDIT_CARD_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(&format!(
        r"\b(?:4\d{{3}}|5[1-5]\d{{2}}|3[47]\d{{2}}|6(?:011|5\d{{2}})){sep}\d{{4}}{sep}\d{{4}}{sep}\d{{1,4}}\b",
        sep = SEP
    ))
    .unwrap()
});

fn mask_api_key(_: &str) -> String {
    "[REDACTED_API_KEY]".to_string()
}
fn mask_bearer(_: &str) -> String {
    "Bearer [REDACTED_TOKEN]".to_string()
}
fn mask_private_key(_: &str) -> String {
    "[REDACTED_PRIVATE_KEY]".to_string()
}

pub fn scan_pii(text: &str) -> Vec<RawPiiMatch> {
    let mut matches = Vec::new();

    for m in EMAIL_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "email",
            category: Category::Pii,
            original: m.as_str().to_string(),
            masked: mask_email(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }
    for m in PHONE_RE.find_iter(text) {
        let matched = m.as_str().trim_end_matches(|c: char| !c.is_ascii_digit() && c != ')');
        matches.push(RawPiiMatch {
            pii_type: "us_phone",
            category: Category::Pii,
            original: matched.to_string(),
            masked: mask_phone(matched),
            start: m.start(),
            end: m.start() + matched.len(),
        });
    }
    for m in SSN_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "ssn",
            category: Category::Pii,
            original: m.as_str().to_string(),
            masked: mask_ssn(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }
    for m in CREDIT_CARD_RE.find_iter(text) {
        let d = digits_only(m.as_str());
        if passes_luhn(&d) {
            matches.push(RawPiiMatch {
                pii_type: "credit_card",
                category: Category::Pci,
                original: m.as_str().to_string(),
                masked: mask_credit_card(m.as_str()),
                start: m.start(),
                end: m.end(),
            });
        }
    }
    for m in API_KEY_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "api_key_generic",
            category: Category::Credential,
            original: m.as_str().to_string(),
            masked: mask_api_key(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }
    for m in BEARER_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "bearer_token",
            category: Category::Credential,
            original: m.as_str().to_string(),
            masked: mask_bearer(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }
    for m in AWS_KEY_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "aws_key",
            category: Category::Credential,
            original: m.as_str().to_string(),
            masked: mask_api_key(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }
    for m in PRIVATE_KEY_RE.find_iter(text) {
        matches.push(RawPiiMatch {
            pii_type: "private_key_header",
            category: Category::Credential,
            original: m.as_str().to_string(),
            masked: mask_private_key(m.as_str()),
            start: m.start(),
            end: m.end(),
        });
    }

    matches.sort_by_key(|m| m.start);
    matches
}

/// Replace PII on the caller's original text with the masked forms.
/// Returns `None` when nothing on this exact string matched, so a homoglyph
/// that was only caught after folding does not produce a draft that still
/// contains the original characters.
pub fn redact_pii(text: &str) -> Option<String> {
    let matches = scan_pii(text);
    if matches.is_empty() {
        return None;
    }
    let raw: Vec<(usize, usize, String)> = matches
        .into_iter()
        .map(|m| (m.start, m.end, m.masked))
        .collect();
    // A phone-shaped run inside an email is a second match. Applying the
    // inner span first used to move the cursor and skip the enclosing email,
    // leaving the rest of the address in the draft. Keep the outer span.
    let mut spans: Vec<(usize, usize, String)> = raw
        .iter()
        .filter(|(start, end, _)| {
            !raw.iter().any(|(other_start, other_end, _)| {
                *other_start <= *start
                    && *end <= *other_end
                    && (*other_start < *start || *end < *other_end)
            })
        })
        .cloned()
        .collect();
    spans.sort_by(|a, b| b.0.cmp(&a.0));
    let mut out = text.to_string();
    let mut cursor = text.len();
    for (start, end, masked) in spans {
        if end > cursor || start > end || end > out.len() {
            continue;
        }
        out.replace_range(start..end, &masked);
        cursor = start;
    }
    if out == text { None } else { Some(out) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_email() {
        let hits = scan_pii("contact me at jane.doe@example.com please");
        assert!(hits.iter().any(|m| m.pii_type == "email"));
    }

    #[test]
    fn redact_replaces_email_and_drops_the_raw_address() {
        let redacted = redact_pii("user@example.com").unwrap();
        assert_eq!(redacted, "u***@example.com");
        assert!(!redacted.contains("user@example.com"));
    }

    #[test]
    fn enclosing_email_is_masked_when_a_phone_sits_inside_it() {
        let input = "write contact555-123-4567@example.com today";
        let redacted = redact_pii(input).unwrap();
        assert_eq!(redacted, "write c***@example.com today");
        assert!(!redacted.contains("555-123-4567"));
        assert!(!redacted.contains("contact555"));
    }

    #[test]
    fn separate_email_and_phone_are_both_masked() {
        let redacted = redact_pii("user@example.com or 555-123-4567").unwrap();
        assert_eq!(redacted, "u***@example.com or ***-***-4567");
    }

    #[test]
    fn valid_luhn_credit_card_detected() {
        // 4111 1111 1111 1111 is a well-known Luhn-valid test Visa number.
        let hits = scan_pii("card: 4111 1111 1111 1111");
        assert!(hits.iter().any(|m| m.pii_type == "credit_card"));
    }

    #[test]
    fn non_luhn_number_shaped_like_a_card_is_not_flagged() {
        let hits = scan_pii("order confirmation 4111 1111 1111 1112");
        assert!(!hits.iter().any(|m| m.pii_type == "credit_card"));
    }

    #[test]
    fn tolerates_asterisk_and_double_space_separators() {
        let hits = scan_pii("card 4111**1111  1111**1111 on file");
        assert!(hits.iter().any(|m| m.pii_type == "credit_card"));
    }

    #[test]
    fn detects_aws_key() {
        let hits = scan_pii("AKIAABCDEFGHIJKLMNOP leaked in logs");
        assert!(hits.iter().any(|m| m.pii_type == "aws_key"));
    }

    #[test]
    fn detects_private_key_header() {
        let hits = scan_pii("-----BEGIN RSA PRIVATE KEY-----\nMIIB...");
        assert!(hits.iter().any(|m| m.pii_type == "private_key_header"));
    }
}
