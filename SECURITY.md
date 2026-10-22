# Security Policy

Secure Pride edition, adapted from Security Policy 2.0.0 (Personal Projects Edition), effective February 1, 2026.
Last updated: October 14, 2026 · Policy owner: [@mazze93](https://github.com/mazze93)
The same policy is published at <https://securepride.org/security/>.

## Overview

This policy covers vulnerability disclosure, incident response, and security practices for Secure Pride: the securepride.org site and the code at [github.com/Secure-Pride/secure-pride](https://github.com/Secure-Pride/secure-pride). I maintain these projects with a commitment to security best practices, privacy-first design, and responsible disclosure.

As an individual open-source developer and security engineer, I welcome collaboration from the security research community to identify and address vulnerabilities.

## Scope

This policy applies to Secure Pride's public code and services, including:

- The securepride.org website and subdomains
- Security tools and automation scripts
- Web applications and APIs
- Open-source libraries and utilities
- Documentation and technical writing projects

### Supported versions

| Version | Supported |
| --- | --- |
| Main/Production Branch | Supported |
| Latest Release | Supported |
| Release - 1 | Supported |
| Older Releases | Not supported |
| Development/Beta Branches | Limited Support |

For projects with specific version support policies, please refer to the individual repository documentation.

## Reporting a vulnerability

Do **not** open a public issue for a suspected vulnerability.

- **Primary contact — GitHub Security Advisory (private vulnerability reporting, preferred):** [report a vulnerability](https://github.com/Secure-Pride/secure-pride/security/advisories/new) (repository Security tab → Advisories → Report a vulnerability).
- **Alternative contact — email:** [security@securepride.org](mailto:security@securepride.org)
- **Sensitive details:** use the private advisory above — only maintainers can read it. No PGP key is published yet, so encrypted email is not offered.

### What to include in your report

1. **Description of the vulnerability** — Clear explanation of the security issue and its potential impact
2. **Affected versions** — Specific versions, branches, or components affected
3. **Attack vector** — How the vulnerability could be exploited
4. **Proof of Concept (PoC)** — Reproducible steps or code demonstrating the vulnerability
5. **Impact assessment** — Potential consequences for users, data, or infrastructure
6. **Proposed remediation** — Suggested fixes or mitigation strategies (optional but appreciated)
7. **CVE request** — Whether you plan to request a CVE identifier
8. **Disclosure timeline** — Your preferred disclosure timeline or deadline

Please avoid disclosing sensitive vulnerability details in public issues, pull requests, or community forums until we have coordinated disclosure.

### What not to report

- Vulnerabilities in third-party dependencies (report to upstream maintainers)
- Social engineering attacks
- Physical security issues
- Denial of Service (DoS) attacks without demonstrable impact
- Issues in deprecated or unsupported versions
- Theoretical vulnerabilities without proof of exploitability

If you are unsure whether an issue qualifies, please report it and we will make the determination.

## Coordinated Vulnerability Disclosure

Secure Pride follows a Coordinated Vulnerability Disclosure (CVD) approach that balances transparency with responsible handling of security issues.

### My commitment to reporters

- **Acknowledgment within 72 hours** — Initial response confirming receipt of your report
- **Status updates as progress is made** — Communication on remediation progress
- **Collaborative approach** — Opportunity to discuss patches or validation testing
- **Public recognition** — Credit in security advisories and release notes (unless you prefer anonymity)
- **Safe harbor** — No legal action for good-faith security research

### Disclosure timeline

| Timeframe | Action |
| --- | --- |
| Day 0 | Vulnerability reported via GitHub Security Advisory or email |
| Day 0–3 | Acknowledgment sent to reporter |
| Day 3–14 | Validation and impact assessment |
| Day 14–90 | Patch development and testing |
| Day 90 | Default public disclosure deadline |
| Post-Patch | Public disclosure via GitHub Security Advisory |

- **Accelerated disclosure:** For critical vulnerabilities with active exploitation or significant impact, I may expedite the timeline with your agreement.
- **Extended disclosure:** If I need additional time beyond 90 days, I'll communicate this and provide progress updates. Public disclosure will occur at 90 days unless you agree to an extension.
- **Early disclosure:** I may disclose earlier than 90 days if a patch is available and stable, with your agreement.

### CVE assignment

For eligible vulnerabilities, I will request CVE assignment through the GitHub Security Advisory system or MITRE directly. CVE publication timing will be coordinated with the public disclosure schedule.

## Incident response

### Severity classification

| Severity | Impact | Response time |
| --- | --- | --- |
| Critical | Data breach, RCE, authentication bypass | 24 hours |
| High | Widespread data exposure, privilege escalation | 72 hours |
| Medium | Limited exposure, moderate impact vulnerabilities | 14 days |
| Low | Minimal impact, edge cases, theoretical issues | 30 days |

### Notification procedures

In the event of a confirmed security incident affecting users:

1. **Immediate containment** — Stop active exploitation and secure affected systems
2. **Impact assessment** — Determine scope of affected users and data
3. **User notification** — Alert affected parties via GitHub Security Advisories and repository announcements
4. **Remediation deployment** — Release patches and security updates
5. **Post-incident review** — Conduct retrospective and update security controls
6. **Public disclosure** — Publish security advisory with timeline, impact, and remediation steps

## Security standards and controls

My security practices align with recognized industry frameworks and standards: NIST Cybersecurity Framework (CSF) Core Functions; OWASP Top 10 Web Application Security Risks; CIS Controls for Effective Cyber Defense; OpenSSF Best Practices Badge criteria; ISO/IEC 27001 information security principles.

The policy lists its repository, CI/CD, and dependency controls "where applicable". The public page marks each one with how a reader can check it — in the repository, partly in place, owner's statement, or not yet in place — as of the date above: <https://securepride.org/security/#controls>. The grades live in `src/lib/site/security-controls.ts` and are re-checked against `.github/workflows` by `src/lib/site/security-controls.test.ts`.

## Safe harbor

I am committed to protecting security researchers who report vulnerabilities in good faith. I will not pursue legal action against researchers who:

- Report vulnerabilities responsibly through designated channels
- Avoid intentional harm to users, data, or infrastructure
- Do not publicly disclose vulnerabilities before coordinated disclosure
- Respect user privacy and data confidentiality
- Comply with applicable laws during security research

I encourage security research that helps improve the security and reliability of open-source software.

## Security best practices for contributors

### For code contributors

- Never commit credentials, API keys, or sensitive data to repositories
- Use environment variables or GitHub Secrets for configuration
- Follow secure coding guidelines for the relevant language/framework
- Include security considerations in pull request descriptions
- Run security scanners locally before submitting pull requests
- Sign all commits with GPG or SSH keys

### For maintainers and collaborators

- Review all code changes for security implications
- Respect branch protection rules and required status checks
- Rotate SSH keys and Personal Access Tokens (PATs) regularly (recommended: every 90 days)
- Monitor repository activity and respond to security alerts
- Address Dependabot and code scanning alerts promptly
- Maintain secure development environments
- Use hardware security keys for 2FA when possible

### Project standards

All contributions must also:

- Have zero telemetry or hidden data collection
- Protect sensitive identity data
- Pass security validation checks
- Be reviewed before merge

## Security resources

- [OWASP Secure Coding Practices](https://owasp.org/projects/secure-coding-practices-quick-reference-guide)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OpenSSF Best Practices](https://www.bestpractices.dev/)

Tools: GitHub Security Features (Dependabot, Secret Scanning, Code Scanning); CodeQL for semantic code analysis; git-secrets / gitleaks for credential detection; SAST/DAST tools for application security testing; Trivy or Grype for container scanning.

## Updates to this policy

This security policy is reviewed and updated periodically in response to emerging threats, best practice evolution, or community feedback. Material changes will be announced through GitHub repository commits and releases, and security advisories for significant policy updates. Version history and change logs are maintained in the repository commit history.

## Acknowledgments

I am grateful to security researchers and community members who help improve the security of my projects. Vulnerability reports that lead to security improvements will be acknowledged in security advisories and release notes (unless anonymity is preferred).

## Legal considerations

This security policy reflects my commitment to responsible vulnerability disclosure and open-source security best practices.

All security research and vulnerability reporting must comply with applicable laws, including the Computer Fraud and Abuse Act (CFAA), Digital Millennium Copyright Act (DMCA), and international equivalents. This safe harbor policy is contingent on good-faith security research conducted within legal boundaries.

For projects involving user data, please refer to individual repository documentation regarding data handling and privacy practices.

---

Based on security best practices from OWASP, OpenSSF, GitHub, and NIST.
