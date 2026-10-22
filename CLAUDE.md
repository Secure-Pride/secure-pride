# Secure Pride — Claude Code Context

This file is a short project index for Claude Code.
Canonical operating policy lives in @docs/COPILOT-INSTRUCTIONS.md.
If this file conflicts with the shared instructions, @docs/COPILOT-INSTRUCTIONS.md wins.

## Project purpose
- Secure Pride is a privacy-first cybersecurity and safety platform for LGBTQ communities.
- Prioritize privacy, accessibility, minimal data collection, and low-cognitive-load UX.
- Preserve pseudonymous participation and avoid designs that increase exposure risk for marginalized users.

## Working style
- Prefer small, reversible changes over broad rewrites.
- Match existing project conventions, architecture, and dependency choices.
- Keep documentation updated when behavior, architecture, or security assumptions change.
- For non-trivial work, present a short plan before implementation.

## Authority
- Tier 1 — Act autonomously: refactors, tests, docs, bug fixes, and small architecture-aligned improvements.
- Tier 2 — Document, then act: schema or persistence changes; authentication, encryption, or security decisions; UX or accessibility changes; third-party integrations; infrastructure or deployment changes. Create or update a Decision file in `decisions/`.
- Tier 3 — Stop and ask: SOGI data handling; credentials, secrets, or external system access; third-party data sharing; policy or legal questions; organizational direction; or any change that weakens privacy or security standards.

## Guardrails
- Do not introduce telemetry, tracking, or third-party analytics.
- Minimize attack surface and prefer privacy-preserving designs.
- Treat all user data as sensitive by default, with heightened protection for SOGI-related data.
- Keep security and accessibility requirements embedded in implementation, not deferred to later cleanup.

## Commands
```bash
npm run dev      # Astro dev server
npm run build    # Static build → dist/
npm run check    # Astro build + tsc validation (run before commit)
```

## Project State
- **Hosting**: Cloudflare Pages + DNS — domain: securepride.org
- **Repo**: `Secure-Pride/secure-pride` (org monorepo since 2026-10-21; `mazze93/secure-pride` redirects) / canonical local: `~/Secure-Pride/secure-pride`
- **Cloudflare**: `_headers` and `_redirects` exist; Pages deployment status — verify in dashboard.
## Workflow
- Before major changes, explain intent, constraints, and verification approach.
- For security- or privacy-relevant work, document risks, tradeoffs, and affected data flows.
- Include exact verification commands for code changes.
- If context is incomplete, read the relevant project docs before acting.
