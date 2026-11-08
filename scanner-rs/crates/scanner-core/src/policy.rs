//! Fail-closed policy orchestrator — verbatim port of
//! `prompt-scanner-rust-respec.md` section 5. `Pass` is unreachable unless
//! every coverage flag is true and both detection stages found nothing.
//! This is the structural fix for the TS engine's silent-`PASS`-on-miss
//! behavior documented in DECISION-002.

use crate::types::{Coverage, Decision, Finding};

pub fn decide(rules_hit: &[Finding], semantic_hit: &[Finding], coverage: &Coverage) -> (Decision, f32) {
    if !coverage.normalization || !coverage.rules {
        return (Decision::RequireReview, 0.0);
    }

    let block = rules_hit.iter().any(|f| f.action == Decision::Block)
        || semantic_hit.iter().any(|f| f.action == Decision::Block);
    if block {
        return (Decision::Block, 0.95);
    }

    let warn = !rules_hit.is_empty() || !semantic_hit.is_empty();
    if warn {
        let base_confidence = if coverage.semantic { 0.8 } else { 0.5 };
        return (Decision::Warn, base_confidence);
    }

    // PASS only allowed when all coverage flags true and zero findings.
    if coverage.semantic {
        (Decision::Pass, 0.9)
    } else {
        (Decision::RequireReview, 0.3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Severity;

    fn finding(action: Decision) -> Finding {
        Finding {
            id: "test".into(),
            severity: Severity::High,
            span: None,
            evidence: None,
            normalized_evidence: None,
            description: "test".into(),
            action,
        }
    }

    fn full_coverage() -> Coverage {
        Coverage { normalization: true, rules: true, semantic: true }
    }

    #[test]
    fn pass_unreachable_without_rules_coverage() {
        let coverage = Coverage { normalization: true, rules: false, semantic: true };
        let (decision, confidence) = decide(&[], &[], &coverage);
        assert_eq!(decision, Decision::RequireReview);
        assert_eq!(confidence, 0.0);
    }

    #[test]
    fn pass_unreachable_without_normalization_coverage() {
        let coverage = Coverage { normalization: false, rules: true, semantic: true };
        let (decision, _) = decide(&[], &[], &coverage);
        assert_eq!(decision, Decision::RequireReview);
    }

    #[test]
    fn pass_unreachable_without_semantic_coverage_even_with_zero_findings() {
        let coverage = Coverage { normalization: true, rules: true, semantic: false };
        let (decision, confidence) = decide(&[], &[], &coverage);
        assert_eq!(decision, Decision::RequireReview);
        assert_eq!(confidence, 0.3);
    }

    #[test]
    fn pass_reachable_only_with_full_coverage_and_zero_findings() {
        let (decision, confidence) = decide(&[], &[], &full_coverage());
        assert_eq!(decision, Decision::Pass);
        assert_eq!(confidence, 0.9);
    }

    #[test]
    fn block_wins_over_warn() {
        let rules_hit = vec![finding(Decision::Warn), finding(Decision::Block)];
        let (decision, confidence) = decide(&rules_hit, &[], &full_coverage());
        assert_eq!(decision, Decision::Block);
        assert_eq!(confidence, 0.95);
    }

    #[test]
    fn semantic_block_also_triggers_block() {
        let semantic_hit = vec![finding(Decision::Block)];
        let (decision, _) = decide(&[], &semantic_hit, &full_coverage());
        assert_eq!(decision, Decision::Block);
    }

    #[test]
    fn any_finding_without_block_warns() {
        let rules_hit = vec![finding(Decision::Warn)];
        let (decision, confidence) = decide(&rules_hit, &[], &full_coverage());
        assert_eq!(decision, Decision::Warn);
        assert_eq!(confidence, 0.8);
    }

    #[test]
    fn warn_confidence_drops_without_semantic_coverage() {
        let coverage = Coverage { normalization: true, rules: true, semantic: false };
        let rules_hit = vec![finding(Decision::Warn)];
        let (decision, confidence) = decide(&rules_hit, &[], &coverage);
        assert_eq!(decision, Decision::Warn);
        assert_eq!(confidence, 0.5);
    }
}
