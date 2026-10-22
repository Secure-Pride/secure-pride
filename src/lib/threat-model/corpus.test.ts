/**
 * Structural checks for the published corpus, ported from the original
 * validator (docs/threat-model/VALIDATION.md) so they run on every build.
 * They prove the format and cross-references, not that any control works.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS, SCENARIOS, SOURCE_LABEL, scenarioById, scenarioSlug } from './corpus';
import { MODEL_FACTS, SCENARIO_LINKS, WALKTHROUGHS } from './model';

const REQUIRED_TEXT = [
  'id', 'title', 'workflow', 'adversary_capability', 'exposure', 'affected_parties', 'harm',
  'proposed_control', 'prerequisites', 'control_induced_harm', 'care_fallback_and_recovery',
  'synthetic_fixture', 'expected_result', 'residual_risk', 'jurisdiction', 'review_date',
] as const;

describe('threat-model corpus', () => {
  it('carries version, status and licence metadata', () => {
    expect(CORPUS.corpus_version).toBe(MODEL_FACTS.version);
    expect(CORPUS.status).toBe('draft-not-community-validated');
    expect(CORPUS.license).toMatch(/Apache-2\.0/);
    expect(CORPUS.canonical_url).toBe('https://securepride.org/threat-model/corpus.json');
  });

  it('has twelve scenarios with unique, ordered IDs', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((_, i) => `SP-${String(i + 1).padStart(2, '0')}`));
    for (const id of ids) expect(scenarioSlug(id)).toMatch(/^sp-\d{2}$/);
  });

  it('fills every required field', () => {
    for (const s of SCENARIOS) {
      for (const field of REQUIRED_TEXT) expect(s[field].trim(), `${s.id}.${field}`).not.toBe('');
      expect(s.probe_steps.length, `${s.id} probe steps`).toBeGreaterThanOrEqual(3);
    }
  });

  it('resolves every source to an https URL with a readable label', () => {
    for (const s of SCENARIOS) {
      expect(s.source_ids.length).toBeGreaterThan(0);
      for (const id of s.source_ids) {
        expect(CORPUS.sources[id], `${s.id} → ${id}`).toMatch(/^https:\/\//);
        expect(SOURCE_LABEL[id], `label for ${id}`).toBeTruthy();
      }
    }
  });

  it('claims nothing it has not shown', () => {
    for (const s of SCENARIOS) {
      expect(s.evidence_class).toBe('synthetic-design-scenario');
      expect(s.control_status).toBe('proposed');
      expect(['not-tested', 'design-walkthrough']).toContain(s.validation_status);
    }
    // Exactly the three paper walkthroughs' primary scenarios are marked as walked through.
    const walked = SCENARIOS.filter((s) => s.validation_status === 'design-walkthrough').map((s) => s.id);
    expect(walked).toEqual(['SP-02', 'SP-03', 'SP-04']);
  });

  it('only cross-references scenarios that exist', () => {
    for (const w of WALKTHROUGHS) for (const id of w.scenarios) expect(scenarioById(id), `walkthrough ${w.id} → ${id}`).toBeDefined();
    for (const id of Object.keys(SCENARIO_LINKS)) expect(scenarioById(id), `link → ${id}`).toBeDefined();
  });
});
