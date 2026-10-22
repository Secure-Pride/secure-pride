/**
 * The policy's controls list, graded by how a reader can check each one.
 *
 * The source policy lists these controls "where applicable". Published on
 * securepride.org without a grade, each line would read as a guarantee —
 * the assurance language the site does not use. So every control carries a
 * grade and the evidence behind it, as of CONTROLS_CHECKED.
 *
 * Grades:
 *   verified — visible in the public repository's files or history
 *   partial  — part of the control is visible; the gap is named
 *   stated   — a repository or account setting no outside reader can see;
 *              published on the owner's word
 *   gap      — checked, and not yet in place
 *
 * Controls with a `probe` are re-checked against .github/workflows on every
 * test run (security-controls.test.ts). When a gap closes, the probe fails
 * and this file — and the page — must be updated.
 */

/* ─── Types ─────────────────────────────────────────────────────────── */

export type ControlGrade = 'verified' | 'partial' | 'stated' | 'gap';

/** Workflow facts the test can check offline. See security-controls.test.ts. */
export type WorkflowProbe =
  | 'actions-sha-pinned'
  | 'permissions-declared'
  | 'packages-write-workflow-wide'
  | 'no-pull-request-target'
  | 'trivy-blocks-critical-high'
  | 'environment-protection'
  | 'artifact-signing'
  | 'provenance-attested'
  | 'sbom-generated'
  | 'license-check';

export interface Control {
  name: string;
  /** The source policy's description, verbatim. */
  claim: string;
  grade: ControlGrade;
  /** What a reader can check, in one sentence. */
  evidence: string;
  /** Offline checks: each must return `expect` for the grade to stand. */
  probes?: ReadonlyArray<{ id: WorkflowProbe; expect: boolean }>;
}

export interface ControlGroup {
  title: string;
  controls: readonly Control[];
}

/* ─── Grade labels (shown on the page) ──────────────────────────────── */

export const CONTROLS_CHECKED = 'October 22, 2026';

export const GRADE_LABEL: Record<ControlGrade, string> = {
  verified: 'In the repository',
  partial: 'Partly in place',
  stated: 'Owner’s statement',
  gap: 'Not yet in place',
};

export const GRADE_MEANING: Record<ControlGrade, string> = {
  verified: 'Anyone can check it in the public repository’s files or history.',
  partial: 'Part of it is visible in the repository. The missing part is named.',
  stated: 'A repository or account setting that is not visible from outside. Published on the owner’s word.',
  gap: 'Checked, and not yet in place.',
};

const NOT_VISIBLE = 'A repository or account setting; not visible from outside.';

/* ─── The ledger ────────────────────────────────────────────────────── */

export const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    title: 'Repository security',
    controls: [
      { name: 'Branch Protection', claim: 'Main branches protected with required reviews and status checks', grade: 'stated', evidence: NOT_VISIBLE },
      { name: 'Secret Scanning', claim: 'Automated detection of exposed credentials and API keys (GitHub native)', grade: 'stated', evidence: NOT_VISIBLE },
      {
        name: 'Dependabot Alerts',
        claim: 'Automated vulnerability scanning and dependency updates',
        grade: 'verified',
        evidence: 'Dependabot pull requests appear in the commit history, for example #68.',
      },
      {
        name: 'Code Scanning',
        claim: 'CodeQL or similar SAST tools for vulnerability detection',
        grade: 'stated',
        evidence: 'No code-scanning workflow file is in the repository; GitHub’s default setup would not appear there.',
      },
      { name: 'Signed Commits', claim: 'GPG/SSH commit signing for authenticity verification', grade: 'stated', evidence: 'GitHub verifies signatures per commit; the repository files do not show them.' },
      { name: 'Two-Factor Authentication', claim: 'Enabled on my GitHub account with hardware security keys', grade: 'stated', evidence: NOT_VISIBLE },
      { name: 'Access Control', claim: 'Principle of least privilege for collaborators', grade: 'stated', evidence: NOT_VISIBLE },
    ],
  },
  {
    title: 'CI/CD pipeline security',
    controls: [
      {
        name: 'SHA-pinned actions',
        claim: 'SHA-pinned action versions for supply chain security',
        grade: 'verified',
        evidence: 'Every uses: reference in .github/workflows pins a full commit SHA, with the version tag kept in a comment.',
        probes: [{ id: 'actions-sha-pinned', expect: true }],
      },
      {
        name: 'Minimal permissions',
        claim: 'Minimal workflow permissions with explicit grants',
        grade: 'partial',
        evidence: 'Every workflow declares its permissions. release.yml grants packages: write to the whole workflow, so its scan job holds a grant it does not use.',
        probes: [
          { id: 'permissions-declared', expect: true },
          { id: 'packages-write-workflow-wide', expect: true },
        ],
      },
      {
        name: 'Fork isolation',
        claim: 'Isolated execution for untrusted code (fork pull requests)',
        grade: 'verified',
        evidence: 'Workflows run on pull_request, not pull_request_target, so fork pull requests get no repository secrets.',
        probes: [{ id: 'no-pull-request-target', expect: true }],
      },
      {
        name: 'Secret management',
        claim: 'Secret management through GitHub Secrets and environment protection',
        grade: 'partial',
        evidence: 'The release workflow uses the per-run GITHUB_TOKEN. No deployment environment with protection rules is configured.',
        probes: [{ id: 'environment-protection', expect: false }],
      },
      {
        name: 'Signing and provenance',
        claim: 'Artifact signing and SLSA provenance where applicable',
        grade: 'partial',
        evidence: 'release.yml asks the image build for SLSA provenance (provenance: mode=max). Images are not signed, and the step runs only on tagged releases; no release has run since it was added.',
        probes: [
          { id: 'provenance-attested', expect: true },
          { id: 'artifact-signing', expect: false },
        ],
      },
    ],
  },
  {
    title: 'Dependency management',
    controls: [
      {
        name: 'Automated updates',
        claim: 'Automated dependency updates via Dependabot',
        grade: 'verified',
        evidence: 'Dependabot pull requests appear in the commit history, for example #68.',
      },
      {
        name: 'Severity threshold',
        claim: 'Vulnerability scanning with severity threshold enforcement',
        grade: 'verified',
        evidence: 'release.yml scans the container image with Trivy and stops the release on fixable critical or high findings.',
        probes: [{ id: 'trivy-blocks-critical-high', expect: true }],
      },
      {
        name: 'SBOM',
        claim: 'SBOM (Software Bill of Materials) generation',
        grade: 'partial',
        evidence: 'release.yml attaches an SBOM attestation to the image (sbom: true). It runs only on tagged releases; no published image carries one yet.',
        probes: [{ id: 'sbom-generated', expect: true }],
      },
      {
        name: 'License compliance',
        claim: 'License compliance verification',
        grade: 'gap',
        evidence: 'No workflow checks dependency licenses.',
        probes: [{ id: 'license-check', expect: false }],
      },
      { name: 'Manual audit', claim: 'Regular manual audit of critical dependencies', grade: 'stated', evidence: 'A practice, not a file; published on the owner’s word.' },
    ],
  },
];

/** Count of controls per grade, for the ledger's summary line. */
export function gradeCounts(groups: readonly ControlGroup[] = CONTROL_GROUPS): Record<ControlGrade, number> {
  const counts: Record<ControlGrade, number> = { verified: 0, partial: 0, stated: 0, gap: 0 };
  for (const group of groups) {
    for (const control of group.controls) counts[control.grade] += 1;
  }
  return counts;
}
