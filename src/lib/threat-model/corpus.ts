/**
 * The threat-model corpus, typed. src/data/threat-model/corpus.json is the
 * single reviewed source: the /threat-model/ pages render from it and
 * /threat-model/corpus.json republishes it unchanged. corpus.test.ts runs
 * the structural checks from the original validator on every build.
 *
 * Plain data and pure helpers, no side effects.
 */
import raw from '../../data/threat-model/corpus.json';

export type EvidenceClass = 'synthetic-design-scenario';
export type ControlStatus = 'proposed';
export type ValidationStatus = 'not-tested' | 'design-walkthrough';

export interface Scenario {
  id: string;
  title: string;
  workflow: string;
  adversary_capability: string;
  exposure: string;
  affected_parties: string;
  harm: string;
  proposed_control: string;
  prerequisites: string;
  control_induced_harm: string;
  care_fallback_and_recovery: string;
  synthetic_fixture: string;
  probe_steps: string[];
  expected_result: string;
  residual_risk: string;
  source_ids: string[];
  evidence_class: EvidenceClass;
  control_status: ControlStatus;
  validation_status: ValidationStatus;
  jurisdiction: string;
  review_date: string;
}

export interface Corpus {
  schema_version: string;
  corpus_version: string;
  title: string;
  status: string;
  updated: string;
  canonical_url: string;
  source_repository: string;
  license: string;
  evidence_note: string;
  sources: Record<string, string>;
  scenarios: Scenario[];
}

export const CORPUS = raw as Corpus;
export const SCENARIOS: readonly Scenario[] = CORPUS.scenarios;

/** Readable names for the corpus source keys. */
export const SOURCE_LABEL: Readonly<Record<string, string>> = {
  LINDDUN: 'LINDDUN privacy threat types',
  WHO: 'WHO digital health data brief',
  UNAIDS: 'UNAIDS HIV programme monitoring guide',
  SIAB: 'Security in a Box, LGBTI community guide',
  'APPLE-L': 'Apple Lockdown Mode',
  'APPLE-S': 'Apple restrictions for supervised devices',
  'SP-HOME': 'securepride.org',
  'SP-PRIVACY': 'securepride.org privacy and processing',
};

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  'not-tested': 'Not tested',
  'design-walkthrough': 'Paper walkthrough',
};

/** URL slug for a scenario: SP-01 → sp-01. */
export const scenarioSlug = (id: string): string => id.toLowerCase();
export const scenarioHref = (id: string): string => `/threat-model/scenarios/${scenarioSlug(id)}/`;

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function sourcesFor(scenario: Scenario): ReadonlyArray<{ id: string; label: string; href: string }> {
  return scenario.source_ids.map((id) => ({
    id,
    label: SOURCE_LABEL[id] ?? id,
    href: CORPUS.sources[id],
  }));
}

/** Previous and next scenario in register order, for page-to-page reading. */
export function neighbours(id: string): { prev?: Scenario; next?: Scenario } {
  const i = SCENARIOS.findIndex((s) => s.id === id);
  return { prev: SCENARIOS[i - 1], next: SCENARIOS[i + 1] };
}
