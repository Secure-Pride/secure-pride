/**
 * The readable threat model, as data: scope, modeling unit, adversaries,
 * walkthroughs, release requirements and prior work. Wording follows
 * docs/threat-model/ (v0.1, 21 October 2026); changes made for publication
 * are listed in docs/decisions/DECISION-011.md.
 *
 * Every scenario ID used here must exist in the corpus; corpus.test.ts
 * fails if one does not. Plain data, no side effects.
 */

export const MODEL_FACTS = {
  version: '0.2',
  drafted: '21 October 2026',
  published: '22 October 2026',
  status: 'Working draft. Not community-validated, clinically reviewed, or deployed as controls.',
} as const;

/** The core modeling unit, read left to right. */
export const MODELING_UNIT: readonly string[] = [
  'Actor with a specified capability',
  'Access or observation',
  'Exposed fact or inferred association',
  'Person bearing the consequence',
  'Harm',
  'Intervention',
  'The intervention’s own possible harm',
  'Test',
  'Residual risk',
];

export const DISTINCTIONS: ReadonlyArray<{ term: string; detail: string }> = [
  {
    term: 'Actual fact versus hostile inference',
    detail: 'A clinic visit may be misread. Harm can occur even when the inferred status is false.',
  },
  {
    term: 'Authority versus legitimacy',
    detail: 'A staff account may be allowed to read a record and still misuse it. A technically valid disclosure can still expose someone to harm.',
  },
  {
    term: 'Configuration versus protection',
    detail: 'A control being switched on is not evidence that it addresses the scenario. A negative scan is not proof of absence.',
  },
];

export const PROTECTED: readonly string[] = [
  'Clinical information',
  'Identity and contact details',
  'Relationships and referrals',
  'Appointments, location and the timing of contact',
  'Recovery paths',
  'The ability to keep obtaining care',
];

export const ADVERSARIES: ReadonlyArray<{ actor: string; capability: string; dontAssume: string }> = [
  {
    actor: 'Coercive household member',
    capability: 'Physical access, a known passcode, a shared account, noticing changes',
    dontAssume: 'That a security change is safe to make visibly',
  },
  {
    actor: 'Targeted phisher or extortionist',
    capability: 'Impersonation, account or session theft, misleading requests',
    dontAssume: 'That every attack needs spyware',
  },
  {
    actor: 'Insider or former worker',
    capability: 'Legitimate access, exports, lingering sessions',
    dontAssume: 'That authorization prevents abuse',
  },
  {
    actor: 'Hostile institution or well-resourced actor',
    capability: 'Requests for records, seizure, targeted exploitation, correlation',
    dontAssume: 'A universal legal power or a uniform country risk',
  },
  {
    actor: 'Compromised administrator or vendor',
    capability: 'Management authority, infrastructure access, logging or backups',
    dontAssume: 'That management adds protection without adding trust',
  },
  {
    actor: 'Opportunistic observer',
    capability: 'Notifications, a shared screen, browser history, a discarded printout',
    dontAssume: 'That encryption hides endpoints or associations',
  },
];

/** Release-blocking design questions. "Unknown" is not a pass. */
export const BLOCKING_QUESTIONS: readonly string[] = [
  'Could the workflow disclose sensitive information involuntarily?',
  'Could its recommendation cause retaliation?',
  'Could it interrupt essential care without a usable fallback?',
  'Could it create a new sensitive repository?',
];

export const CONTROL_CONTRACT: readonly string[] = [
  'Scenario IDs',
  'Intended beneficiary',
  'Owner',
  'Prerequisites',
  'Mechanism',
  'Evidence basis',
  'Possible new harm',
  'Care fallback',
  'Rollback',
  'A concrete test',
  'Residual risk',
  'Review date',
];

/* ─── Walkthroughs (paper counterexamples, not executed tests) ──────── */

export interface Walkthrough {
  id: 'a' | 'b' | 'c';
  title: string;
  scenarios: readonly string[];
  start: string;
  steps: readonly string[];
  result: string;
  repair: string;
  repass: string;
}

export const WALKTHROUGHS: readonly Walkthrough[] = [
  {
    id: 'a',
    title: 'Disclosure despite successful name removal',
    scenarios: ['SP-02', 'SP-11'],
    start: 'A worker drafts a story about the only participant from a small island who spoke at a publicly recorded event on a named date. It describes a care visit. No name, address or phone number appears.',
    steps: [
      'A pattern scanner finds no matching direct identifier.',
      'The draft is labelled safe, or forwarded, because of that result.',
      'A reader matches the event and place against the public speaker list.',
      'The reader links the care story to a person. Even a mistaken match can harm them.',
    ],
    result: 'The safety claim fails. Pattern absence did not test whether context identifies someone. The Secure Pride scanner does not make this claim; its no-match result says so.',
    repair: 'Remove any sharing authorization from the result and keep its narrow meaning. Require purpose and contextual review. Prefer wholly invented examples when real detail is unnecessary.',
    repass: 'Remove the island but keep the unique date and role: the person is still identifiable. Removing a few fields is not enough. The repaired contract holds on paper because it never authorizes sharing. No claim that redaction guarantees anonymity survives.',
  },
  {
    id: 'b',
    title: 'A private assessment becomes a disclosure',
    scenarios: ['SP-03'],
    start: 'A visitor uses a shared browser. A proposed wizard asks whether their phone is shared and which care workflow they use.',
    steps: [
      'The wizard autosaves answers to local storage for convenience.',
      'No answers reach the server, so the design is called private.',
      'Another person reopens the browser and the wizard restores the answers.',
      'The assessment exposes a care association without any network breach.',
    ],
    result: '“Local means safe on a shared device” fails.',
    repair: 'No automatic saving or export of answers. Ask for less. Never ask about medical status. Say plainly what traces the browser keeps. Build no wizard until it beats static guidance.',
    repass: 'Memory-only answers avoid autosave, but an answer in a URL, the back/forward cache, a screenshot, session restore or a download can still keep clues. “Leaves no trace” still fails. A quick-exit button must not promise to erase history.',
  },
  {
    id: 'c',
    title: 'Stronger device rules block care',
    scenarios: ['SP-04', 'SP-07'],
    start: 'An organization recommends supervised phones and a restrictive app policy to everyone using its services.',
    steps: [
      'A client relies on a shared phone and one account for appointments.',
      'Supervision erases the phone, or the new policy blocks the portal needed to regain access.',
      'Recovery needs an unavailable second factor, or a controlling household member.',
      'The policy applies successfully. The client loses timely contact with the service.',
    ],
    result: '“The restriction applied, so protection improved” fails. The success test left out availability, autonomy and recovery.',
    repair: 'Treat device ownership separately. Review prerequisites and recovery first. Never make supervision a condition of care. Test essential tasks and an agreed alternative contact route before changing anything.',
    repass: 'A phone fallback also fails if the same household member controls that number. The plan needs an independently usable route, not just a second channel. If no safe fallback exists, defer the disruptive control and record why.',
  },
];

/* ─── Release requirements: what has to be true before claims ───────── */

export type RequirementStatus = 'met' | 'partial' | 'open';

export const REQUIREMENT_LABEL: Record<RequirementStatus, string> = {
  met: 'Met',
  partial: 'Partly met',
  open: 'Open',
};

/** Grade class reused from the controls ledger, so colour means the same thing site-wide. */
export const REQUIREMENT_GRADE: Record<RequirementStatus, 'verified' | 'partial' | 'gap'> = {
  met: 'verified',
  partial: 'partial',
  open: 'gap',
};

export const RELEASE_REQUIREMENTS: ReadonlyArray<{
  requirement: string;
  evidence: string;
  status: RequirementStatus;
  note: string;
}> = [
  {
    requirement: 'Accurate processing disclosure',
    evidence: 'Code, configuration and logging inventory aligned with the public notice',
    status: 'partial',
    note: 'The privacy notice describes the scanner’s processing and names what is unverified (hosting retention and locations). No full inventory has been reconciled against it.',
  },
  {
    requirement: 'Scanner result does not authorize disclosure',
    evidence: 'Synthetic contextual-identification tests plus interface review',
    status: 'partial',
    note: 'An SP-02 fixture runs against the pattern engine on every build and returns no match, and the no-match wording is tested not to clear sharing. No interface review with users yet.',
  },
  {
    requirement: 'No sensitive assessment transmission',
    evidence: 'Network capture through success, failure and retry paths',
    status: 'open',
    note: 'No interactive assessment exists. These pages ask nothing and store nothing; ordinary page requests still reach the host.',
  },
  {
    requirement: 'No unintended answer persistence',
    evidence: 'Storage, history, back/forward, reopen, crash and restore checks',
    status: 'open',
    note: 'Applies once a planner is built (SP-03). Not started.',
  },
  {
    requirement: 'Care access survives controls',
    evidence: 'Named essential workflows tested on real device and profile versions',
    status: 'open',
    note: 'No device tests have run.',
  },
  {
    requirement: 'Accessible under pressure',
    evidence: 'Keyboard, screen reader, low-bandwidth and comprehension sessions',
    status: 'open',
    note: 'Pages follow the site’s accessible patterns; no sessions with people have run.',
  },
  {
    requirement: 'Contextual suitability',
    evidence: 'Consented community and service review; jurisdiction-specific assessment',
    status: 'open',
    note: 'Not conducted. No community endorsement is claimed.',
  },
  {
    requirement: 'Safe incident intake',
    evidence: 'Owner, channel, access, retention and escalation agreed',
    status: 'open',
    note: 'Not established. Do not send real incidents through any Secure Pride form or issue.',
  },
];

/* ─── Prior work this builds on ─────────────────────────────────────── */

export const PRIOR_WORK: ReadonlyArray<{ label: string; href: string; contribution: string; boundary: string }> = [
  {
    label: 'Security in a Box, LGBTI community guide',
    href: 'https://securityinabox.org/media/en/blog/cf-lgbti-africa.pdf',
    contribution: 'Community-specific risk assessment and tactics, written with community contributors',
    boundary: 'Introduction and contents read; 2014 technical advice not re-validated',
  },
  {
    label: 'MPact safety and security blueprint',
    href: 'https://www.mpactglobal.org/toolkits/lgbtq-safety-and-security-blueprint',
    contribution: 'Physical, digital and organizational planning for LGBTQ organizations',
    boundary: 'Public description read; full blueprint not reviewed',
  },
  {
    label: 'EFF Surveillance Self-Defense',
    href: 'https://ssd.eff.org/',
    contribution: 'Individual security planning and surveillance protection',
    boundary: 'No complete catalogue comparison',
  },
  {
    label: 'LINDDUN threat types',
    href: 'https://linddun.org/threat-types/',
    contribution: 'Linking, identifying, detecting and other privacy threat mechanisms',
    boundary: 'Categories read; we claim no invention of these concepts',
  },
  {
    label: 'WHO digital health data brief',
    href: 'https://www.who.int/publications/i/item/9789240064355',
    contribution: 'HIV data governance, access and confidentiality',
    boundary: 'Overview and an excerpt read; no local legal analysis',
  },
  {
    label: 'UNAIDS confidentiality and security assessment',
    href: 'https://unaids.org/en/resources/documents/2019/confidentiality_security_assessment_tool',
    contribution: 'Institutional assessment of how health information is collected, stored and used',
    boundary: 'Overview read; the instrument was not run',
  },
  {
    label: 'UNAIDS programme monitoring guide',
    href: 'https://jointsiwg.unaids.org/wp-content/uploads/2025/03/Monitoring-HIV-Programs_English.pdf',
    contribution: 'Safe outreach, minimized identifiers and consent around referrals',
    boundary: 'Relevant excerpt read; full toolkit not audited',
  },
  {
    label: 'Apple Lockdown Mode',
    href: 'https://support.apple.com/en-ie/105120',
    contribution: 'Platform capability and its restrictions',
    boundary: 'Documentation only; no device tests',
  },
  {
    label: 'Apple restrictions for supervised devices',
    href: 'https://support.apple.com/guide/deployment/restrictions-for-supervised-devices-dep6b5ae23e9/web',
    contribution: 'Enforcement options and supervision prerequisites',
    boundary: 'Documentation only; Configurator not inspected',
  },
];

/** Claims this work does not make, stated so nobody has to infer them. */
export const NOT_CLAIMED: readonly string[] = [
  'First of its kind',
  'Comprehensive',
  'Community-led or community-validated',
  'Clinically validated',
  'Spyware-proof',
  'That using it reduces real-world harm',
];

/** Where each scenario surfaces elsewhere on the site. */
export const SCENARIO_LINKS: Readonly<Record<string, ReadonlyArray<{ href: string; label: string }>>> = {
  'SP-02': [{ href: '/tools/scanner/', label: 'AI Safety Scanner — its no-match result links here' }],
  'SP-11': [
    { href: '/tools/scanner/', label: 'AI Safety Scanner — do not submit real records' },
    { href: '/security/', label: 'Report a vulnerability — the private route for real incidents in our code' },
  ],
  'SP-03': [{ href: '/privacy/', label: 'Privacy and processing — what the hosted tools receive' }],
};
