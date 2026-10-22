# Prior work and evidence ledger

Reviewed 21 October 2026. Targeted discovery, not a systematic literature review. Search scope: English-language queries combining LGBTQ/LGBTI, HIV services, digital security, threat modeling, confidentiality, and known primary-source publishers. Search absence does not establish novelty. No inference that older tool instructions remain current.

## Comparison

| Source | Existing contribution to reuse | Boundary of this review |
|---|---|---|
| [Security in a Box, LGBTI community guide](https://securityinabox.org/media/en/blog/cf-lgbti-africa.pdf) | Community-specific risk assessment and security tactics, developed with community contributors | Introduction and contents inspected; not a chapter-by-chapter audit or validation of 2014 technical advice |
| [MPact safety and security blueprint](https://www.mpactglobal.org/toolkits/lgbtq-safety-and-security-blueprint) | Physical, digital and organizational planning for LGBTQ organizations | Public description inspected; underlying blueprint not fully reviewed |
| [EFF Surveillance Self-Defense](https://ssd.eff.org/) | Individual security planning and surveillance protection | Resource discovery; no complete catalogue comparison |
| [LINDDUN threat types](https://linddun.org/threat-types/) | Linking, identifying, detecting and other privacy threat mechanisms | Category descriptions inspected; no claim to invent these concepts |
| [WHO digital health data brief](https://www.who.int/publications/i/item/9789240064355) | HIV data governance, access and confidentiality | Overview and available guidance excerpt reviewed; no local legal analysis |
| [UNAIDS confidentiality assessment](https://unaids.org/en/resources/documents/2019/confidentiality_security_assessment_tool) | Institutional assessment of collection, storage and use of health information | Overview inspected; full assessment instrument not executed |
| [UNAIDS programme monitoring guide](https://jointsiwg.unaids.org/wp-content/uploads/2025/03/Monitoring-HIV-Programs_English.pdf) | Safe outreach, minimized identifiers and consent around referrals | Retrieved relevant excerpt; full toolkit not audited |
| [Apple Lockdown Mode](https://support.apple.com/en-ie/105120) | Platform capability and operational restrictions | Documentation review only; no device tests |
| [Apple supervised restrictions](https://support.apple.com/guide/deployment/restrictions-for-supervised-devices-dep6b5ae23e9/web) | Enforcement options and supervision prerequisites | Documentation review only; installed Configurator not inspected |

## Claim disposition

- “No threat model or security guidance exists for these communities”: **did not hold**. Existing work directly contradicts that broad claim.
- “There is no equivalent maintained, testable corpus connecting HIV service workflows, disclosure harm, control-induced harm and product release checks”: **unresolved**. This bounded search cannot prove absence. Treat this as a research question, not launch copy.
- “The proposed contribution can be useful without being first”: **plausible design hypothesis**. Utility needs practitioner comparison and review; no usefulness study occurred.
- “Historical neglect means no community expertise exists”: **reject as a framing assumption**. Credit existing practitioners and seek participation without promising endorsement.

## SecurePride observations

The [retrieved homepage](https://securepride.org/) describes a hosted text scanner and explicitly limits its claims, including a warning against submitting sensitive records. This makes the scanner a useful integration point for bounded output, not a destination for private threat assessments.

The homepage's processing/logging link led to a [privacy page](https://securepride.org/privacy/) that called itself a template and used broad data-practice language. **Observed documentation mismatch**, not proof of undisclosed collection, a vulnerability, or backend behavior. Recheck with a fresh deployment read and actual configuration before remediation; web retrieval may reflect caching.

**Rechecked 22 October 2026 — resolved.** A fresh read of the live page and of `src/pages/privacy.astro` shows a specific processing notice (updated 2 October 2026): where scanner text goes, what the audit log records, and which hosting details remain unverified. The template retrieval most likely reflected a cache or an earlier deploy. A full code/config/logging inventory reconciled against the notice is still open (release requirement 1).

The [public repository](https://github.com/Secure-Pride/secure-pride) describes Astro/Cloudflare surfaces and a no-telemetry baseline. These are declared properties, not verified deployment facts. No repository revision was pinned or code audit performed for this review. The integration spec was written at route level; it was implemented against `main` on 22 October 2026 (DECISION-011).

## Research work that would change the novelty verdict

Review the complete MPact and UNAIDS instruments; search regional and non-English community work; compare HIV service and survivor-safety frameworks; examine maintained test corpora; ask practitioners what is already used privately and cannot safely be published. Record overlap and revise the contribution accordingly. Preserve existing methods' attribution and licenses.

## Responsible public wording

“A developing set of testable threat scenarios for disclosure, coercion and continuity of care, informed by existing community security and HIV confidentiality work.”

Do not yet claim: first-of-its-kind, comprehensive, community-led, community-validated, clinically validated, spyware-proof, no data collected, or operational harm reduction.
