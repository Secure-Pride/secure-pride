# Validation report

21 October 2026 — completed on the generated v0.1 files.

Structural checks passed: JSON parses; 12 scenario IDs are unique; required fields are non-empty; source references resolve within the corpus; every scenario has at least three probe steps; all controls are marked proposed; exactly three cases are labeled design walkthroughs; all scenario IDs occur in the readable model; all five core documents exist.

The three walkthrough labels refer to the explicit paper counterexamples in TOUCHSTONE.md. They do not mean that device, browser or service behavior passed tests.

Not checked: schema interoperability with an existing SecurePride application, URL availability by this validator, implementation behavior, full literature coverage, incident prevalence, community usefulness, accessibility, local law, clinical suitability, security of the public deployment or real-world harm reduction.

Build/validation procedure: the original generator script was kept outside the repository. Its structural checks now live in `src/lib/threat-model/corpus.test.ts` and run in CI on every pull request, alongside `sp02-scanner-boundary.test.ts`, which replays the SP-02 fixture against the TypeScript pattern engine. No tests were performed against the live scanner and no sensitive records were processed.
