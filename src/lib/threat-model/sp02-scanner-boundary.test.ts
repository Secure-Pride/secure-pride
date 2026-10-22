/**
 * SP-02, first bounded implementation: a name-free story that still
 * identifies someone. The pattern engine is expected to miss it — that is
 * the boundary — and the no-match wording must never read as clearance.
 * All text here is invented.
 */
import { describe, expect, it } from 'vitest';
import { detectInjections } from '../../../functions/_lib/dlp/patterns.js';
import { detectPII } from '../../../functions/_lib/dlp/pii.js';
import { NO_MATCH_GUIDANCE, NO_MATCH_SCENARIOS } from '../../components/tools/scanner-results';
import { scenarioById } from './corpus';

// Synthetic fixture from the corpus: the only speaker from an invented
// island at an invented, publicly listed event. No name, address or number.
const ROSTER = 'Harbour Voices forum, 14 March: one speaker from Little Tern Island, peer outreach lead.';
const NARRATIVE =
  'After speaking at the Harbour Voices forum on 14 March, our peer outreach lead from Little Tern Island came in for a follow-up care visit.';

describe('SP-02: context survives pattern redaction', () => {
  it('uses the corpus fixture and expected result', () => {
    const sp02 = scenarioById('SP-02');
    expect(sp02?.synthetic_fixture).toMatch(/only speaker/);
    expect(sp02?.expected_result).toMatch(/No-match never authorizes sharing/);
  });

  it('is missed by the pattern engine even though a reader can link it', () => {
    expect(detectPII(NARRATIVE)).toEqual([]);
    expect(detectInjections(NARRATIVE)).toEqual([]);
    // The linkage a reader would make: event, date and place all appear in the public roster.
    for (const clue of ['Harbour Voices', '14 March', 'Little Tern Island']) {
      expect(NARRATIVE).toContain(clue);
      expect(ROSTER).toContain(clue);
    }
  });

  it('keeps the no-match result from authorizing disclosure', () => {
    expect(NO_MATCH_GUIDANCE).not.toMatch(/safe to share|is safe|cleared|approved/i);
    expect(NO_MATCH_GUIDANCE).toMatch(/can still identify someone/);
    expect(NO_MATCH_SCENARIOS).toContain('SP-02');
  });
});
