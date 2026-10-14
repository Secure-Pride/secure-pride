/**
 * SECURITY.md (what GitHub shows) and /security/ (what the site shows) must
 * state the same policy. The page renders from security-policy.ts, so this
 * test pins SECURITY.md to the same facts and tables.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMITMENTS,
  DISCLOSURE_TIMELINE,
  NOT_TO_REPORT,
  POLICY_FACTS,
  REPORT_CONTENTS,
  SAFE_HARBOR_CONDITIONS,
  SEVERITY_MATRIX,
  SUPPORTED_VERSIONS,
} from './security-policy';

const markdown = readFileSync(join(process.cwd(), 'SECURITY.md'), 'utf8');

describe('SECURITY.md matches the published policy', () => {
  it('states the same facts', () => {
    expect(markdown).toContain(`Security Policy ${POLICY_FACTS.sourceVersion}`);
    expect(markdown).toContain(`Last updated: ${POLICY_FACTS.adapted}`);
    expect(markdown).toContain(`Acknowledgment within ${POLICY_FACTS.ackHours} hours`);
    expect(markdown).toContain(`beyond ${POLICY_FACTS.disclosureDays} days`);
    expect(markdown).toContain(POLICY_FACTS.email);
    expect(markdown).toContain(POLICY_FACTS.advisoryUrl);
  });

  it('carries no superseded commitment', () => {
    expect(markdown).not.toMatch(/48 hours|5 business days/);
  });

  it('carries every table row and list item', () => {
    for (const row of DISCLOSURE_TIMELINE) expect(markdown).toContain(`| ${row.when} | ${row.action} |`);
    for (const row of SEVERITY_MATRIX) expect(markdown).toContain(`| ${row.severity} | ${row.impact} | ${row.response} |`);
    for (const row of SUPPORTED_VERSIONS) expect(markdown).toContain(`| ${row.version} | ${row.supported} |`);
    for (const item of [...REPORT_CONTENTS, ...COMMITMENTS]) expect(markdown).toContain(`**${item.term}** — ${item.detail}`);
    for (const line of [...NOT_TO_REPORT, ...SAFE_HARBOR_CONDITIONS]) expect(markdown).toContain(`- ${line}`);
  });
});
