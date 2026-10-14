/**
 * Keeps the published controls ledger honest. Every probe in
 * security-controls.ts is re-run against .github/workflows. A failure means
 * the repository changed (a gap closed, or a control regressed): update the
 * control's grade and evidence, then this test passes again.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTROL_GROUPS, gradeCounts, type WorkflowProbe } from './security-controls';

/* ─── Workflow corpus ────────────────────────────────────────────────── */

interface Corpus {
  workflows: ReadonlyArray<{ file: string; text: string }>;
  all: string;
  release: string;
}

function corpusOf(workflows: Corpus['workflows']): Corpus {
  return {
    workflows,
    all: workflows.map((w) => w.text).join('\n'),
    release: workflows.find((w) => w.file === 'release.yml')?.text ?? '',
  };
}

const WORKFLOW_DIR = join(process.cwd(), '.github', 'workflows');
const repo = corpusOf(
  readdirSync(WORKFLOW_DIR)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((file) => ({ file, text: readFileSync(join(WORKFLOW_DIR, file), 'utf8') })),
);

/** Lines before the first `jobs:` key — the workflow-level settings. */
const header = (text: string): string => text.split(/^jobs:/m)[0];

/* ─── Probes ─────────────────────────────────────────────────────────── */

const PROBES: Record<WorkflowProbe, (c: Corpus) => boolean> = {
  'actions-sha-pinned': ({ all }) => {
    const refs = [...all.matchAll(/uses:\s*[\w.-]+\/[\w./-]+@([\w.-]+)/g)].map((m) => m[1]);
    return refs.length > 0 && refs.every((ref) => /^[0-9a-f]{40}$/.test(ref));
  },
  'permissions-declared': ({ workflows }) => workflows.every((w) => /^permissions:/m.test(header(w.text))),
  'packages-write-workflow-wide': ({ release }) => /^\s+packages:\s*write/m.test(header(release)),
  'no-pull-request-target': ({ all }) => !/pull_request_target/.test(all),
  'trivy-blocks-critical-high': ({ release }) =>
    /aquasecurity\/trivy-action/.test(release) && /severity:\s*CRITICAL,HIGH/.test(release) && /exit-code:\s*'1'/.test(release),
  'environment-protection': ({ all }) => /^\s+environment:/m.test(all),
  'artifact-signing': ({ all }) => /cosign|attest-build-provenance|slsa-github-generator|provenance:\s*true/i.test(all),
  'sbom-generated': ({ all }) => /sbom|syft|cyclonedx|spdx/i.test(all),
  'license-check': ({ all }) => /license-checker|licensee|license-compliance|licensed\b/i.test(all),
};

/* ─── Tests ──────────────────────────────────────────────────────────── */

describe('controls ledger', () => {
  it('reads the repository workflows', () => {
    expect(repo.workflows.length).toBeGreaterThan(0);
    expect(repo.release).not.toBe('');
  });

  for (const group of CONTROL_GROUPS) {
    for (const control of group.controls) {
      for (const probe of control.probes ?? []) {
        it(`${control.name}: ${probe.id} is ${probe.expect}`, () => {
          expect(PROBES[probe.id](repo)).toBe(probe.expect);
        });
      }
    }
  }

  it('gives every control evidence and a probe-backed grade where one is checkable', () => {
    for (const group of CONTROL_GROUPS) {
      for (const control of group.controls) {
        expect(control.evidence.length).toBeGreaterThan(10);
        if (control.grade === 'gap') expect(control.probes?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('counts grades', () => {
    const counts = gradeCounts();
    const total = CONTROL_GROUPS.reduce((n, g) => n + g.controls.length, 0);
    expect(counts.verified + counts.partial + counts.stated + counts.gap).toBe(total);
  });
});

describe('probes see what they claim to see', () => {
  // Seeded corpus with every feature present. Each probe must flip, or a
  // passing "not yet in place" result above would prove nothing.
  const seeded = corpusOf([
    {
      file: 'release.yml',
      text: [
        'permissions:',
        '  contents: read',
        'jobs:',
        '  release:',
        '    environment: production',
        '    steps:',
        '      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
        '      - uses: actions/attest-build-provenance@1c608d11d69870c2092266b3f9a6f3abbf17002c',
        '      - uses: anchore/sbom-action@f325610c9f50a54015d37c8d16cb3b0e2c8f4de0',
        '      - run: npx license-checker --production',
      ].join('\n'),
    },
  ]);

  it('flips every gap probe on a corpus that has the feature', () => {
    expect(PROBES['actions-sha-pinned'](seeded)).toBe(true);
    expect(PROBES['artifact-signing'](seeded)).toBe(true);
    expect(PROBES['sbom-generated'](seeded)).toBe(true);
    expect(PROBES['license-check'](seeded)).toBe(true);
    expect(PROBES['environment-protection'](seeded)).toBe(true);
    expect(PROBES['packages-write-workflow-wide'](seeded)).toBe(false);
  });
});
