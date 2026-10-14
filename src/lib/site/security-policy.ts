/**
 * Secure Pride's security policy, as data.
 *
 * Source: the founder's Security Policy 2.0.0 (Personal Projects Edition,
 * effective February 1, 2026), adapted for Secure Pride on 2026-10-14.
 * Wording is the source's unless DECISION-009 lists the change. The page
 * (src/pages/security.astro) and SECURITY.md both state these facts;
 * security-policy.test.ts fails if SECURITY.md drifts from them.
 *
 * Plain data, no side effects.
 */

/* ─── Facts other files must agree with ─────────────────────────────── */

export const POLICY_FACTS = {
  sourceVersion: '2.0.0 (Personal Projects Edition)',
  sourceEffective: 'February 1, 2026',
  adapted: 'October 14, 2026',
  owner: '@mazze93',
  ackHours: 72,
  disclosureDays: 90,
  email: 'security@securepride.org',
  advisoryUrl: 'https://github.com/mazze93/secure-pride/security/advisories/new',
  repoUrl: 'https://github.com/mazze93/secure-pride',
} as const;

/* ─── Shared shapes ─────────────────────────────────────────────────── */

/** A bolded term with its explanation ("Term — detail"). */
export interface TermItem {
  term: string;
  detail: string;
}

/* ─── Scope ─────────────────────────────────────────────────────────── */

export const SCOPE: readonly string[] = [
  'The securepride.org website and subdomains',
  'Security tools and automation scripts',
  'Web applications and APIs',
  'Open-source libraries and utilities',
  'Documentation and technical writing projects',
];

export const SUPPORTED_VERSIONS: ReadonlyArray<{ version: string; supported: string }> = [
  { version: 'Main/Production Branch', supported: 'Supported' },
  { version: 'Latest Release', supported: 'Supported' },
  { version: 'Release - 1', supported: 'Supported' },
  { version: 'Older Releases', supported: 'Not supported' },
  { version: 'Development/Beta Branches', supported: 'Limited Support' },
];

/* ─── Reporting ─────────────────────────────────────────────────────── */

export const REPORT_CONTENTS: readonly TermItem[] = [
  { term: 'Description of the vulnerability', detail: 'Clear explanation of the security issue and its potential impact' },
  { term: 'Affected versions', detail: 'Specific versions, branches, or components affected' },
  { term: 'Attack vector', detail: 'How the vulnerability could be exploited' },
  { term: 'Proof of Concept (PoC)', detail: 'Reproducible steps or code demonstrating the vulnerability' },
  { term: 'Impact assessment', detail: 'Potential consequences for users, data, or infrastructure' },
  { term: 'Proposed remediation', detail: 'Suggested fixes or mitigation strategies (optional but appreciated)' },
  { term: 'CVE request', detail: 'Whether you plan to request a CVE identifier' },
  { term: 'Disclosure timeline', detail: 'Your preferred disclosure timeline or deadline' },
];

export const NOT_TO_REPORT: readonly string[] = [
  'Vulnerabilities in third-party dependencies (report to upstream maintainers)',
  'Social engineering attacks',
  'Physical security issues',
  'Denial of Service (DoS) attacks without demonstrable impact',
  'Issues in deprecated or unsupported versions',
  'Theoretical vulnerabilities without proof of exploitability',
];

/* ─── Coordinated disclosure ────────────────────────────────────────── */

export const COMMITMENTS: readonly TermItem[] = [
  { term: `Acknowledgment within ${POLICY_FACTS.ackHours} hours`, detail: 'Initial response confirming receipt of your report' },
  { term: 'Status updates as progress is made', detail: 'Communication on remediation progress' },
  { term: 'Collaborative approach', detail: 'Opportunity to discuss patches or validation testing' },
  { term: 'Public recognition', detail: 'Credit in security advisories and release notes (unless you prefer anonymity)' },
  { term: 'Safe harbor', detail: 'No legal action for good-faith security research' },
];

/** Table 2 of the source: one station per row, drawn on the gold seam. */
export const DISCLOSURE_TIMELINE: ReadonlyArray<{ when: string; action: string }> = [
  { when: 'Day 0', action: 'Vulnerability reported via GitHub Security Advisory or email' },
  { when: 'Day 0–3', action: 'Acknowledgment sent to reporter' },
  { when: 'Day 3–14', action: 'Validation and impact assessment' },
  { when: 'Day 14–90', action: 'Patch development and testing' },
  { when: 'Day 90', action: 'Default public disclosure deadline' },
  { when: 'Post-Patch', action: 'Public disclosure via GitHub Security Advisory' },
];

export const DISCLOSURE_VARIANTS: readonly TermItem[] = [
  {
    term: 'Accelerated disclosure',
    detail: 'For critical vulnerabilities with active exploitation or significant impact, I may expedite the timeline with your agreement.',
  },
  {
    term: 'Extended disclosure',
    detail: `If I need additional time beyond ${POLICY_FACTS.disclosureDays} days, I’ll communicate this and provide progress updates. Public disclosure will occur at ${POLICY_FACTS.disclosureDays} days unless you agree to an extension.`,
  },
  {
    term: 'Early disclosure',
    detail: `I may disclose earlier than ${POLICY_FACTS.disclosureDays} days if a patch is available and stable, with your agreement.`,
  },
];

/* ─── Incident response ─────────────────────────────────────────────── */

export const SEVERITY_MATRIX: ReadonlyArray<{ severity: string; impact: string; response: string }> = [
  { severity: 'Critical', impact: 'Data breach, RCE, authentication bypass', response: '24 hours' },
  { severity: 'High', impact: 'Widespread data exposure, privilege escalation', response: '72 hours' },
  { severity: 'Medium', impact: 'Limited exposure, moderate impact vulnerabilities', response: '14 days' },
  { severity: 'Low', impact: 'Minimal impact, edge cases, theoretical issues', response: '30 days' },
];

export const NOTIFICATION_STEPS: readonly TermItem[] = [
  { term: 'Immediate containment', detail: 'Stop active exploitation and secure affected systems' },
  { term: 'Impact assessment', detail: 'Determine scope of affected users and data' },
  { term: 'User notification', detail: 'Alert affected parties via GitHub Security Advisories and repository announcements' },
  { term: 'Remediation deployment', detail: 'Release patches and security updates' },
  { term: 'Post-incident review', detail: 'Conduct retrospective and update security controls' },
  { term: 'Public disclosure', detail: 'Publish security advisory with timeline, impact, and remediation steps' },
];

/* ─── Safe harbor ───────────────────────────────────────────────────── */

export const SAFE_HARBOR_CONDITIONS: readonly string[] = [
  'Report vulnerabilities responsibly through designated channels',
  'Avoid intentional harm to users, data, or infrastructure',
  'Do not publicly disclose vulnerabilities before coordinated disclosure',
  'Respect user privacy and data confidentiality',
  'Comply with applicable laws during security research',
];

/* ─── Standards, contributors, resources ────────────────────────────── */

export const STANDARDS: readonly string[] = [
  'NIST Cybersecurity Framework (CSF) Core Functions',
  'OWASP Top 10 Web Application Security Risks',
  'CIS Controls for Effective Cyber Defense',
  'OpenSSF Best Practices Badge criteria',
  'ISO/IEC 27001 information security principles',
];

export const CONTRIBUTOR_PRACTICES: readonly string[] = [
  'Never commit credentials, API keys, or sensitive data to repositories',
  'Use environment variables or GitHub Secrets for configuration',
  'Follow secure coding guidelines for the relevant language/framework',
  'Include security considerations in pull request descriptions',
  'Run security scanners locally before submitting pull requests',
  'Sign all commits with GPG or SSH keys',
];

export const MAINTAINER_PRACTICES: readonly string[] = [
  'Review all code changes for security implications',
  'Respect branch protection rules and required status checks',
  'Rotate SSH keys and Personal Access Tokens (PATs) regularly (recommended: every 90 days)',
  'Monitor repository activity and respond to security alerts',
  'Address Dependabot and code scanning alerts promptly',
  'Maintain secure development environments',
  'Use hardware security keys for 2FA when possible',
];

export const RESOURCE_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'OWASP Secure Coding Practices', href: 'https://owasp.org/projects/secure-coding-practices-quick-reference-guide' },
  { label: 'GitHub Security Best Practices', href: 'https://docs.github.com/en/code-security' },
  { label: 'OpenSSF Best Practices', href: 'https://www.bestpractices.dev/' },
];

export const RESOURCE_TOOLS: readonly string[] = [
  'GitHub Security Features (Dependabot, Secret Scanning, Code Scanning)',
  'CodeQL for semantic code analysis',
  'git-secrets / gitleaks for credential detection',
  'SAST/DAST tools for application security testing',
  'Trivy or Grype for container scanning',
];
