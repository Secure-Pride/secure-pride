# DECISION-015: Serve the public site from a Worker

**Status**: Accepted — directed by the founder ("get cloudflare workers connected and deploying the site").
**Date**: 2026-11-10
**Category**: Infrastructure
**Decision ID**: DECISION-015
**Authority**: Tier 2. The Pages project stays in the account so DNS can move back.

## Context

`securepride.org` and `www.securepride.org` are proxied CNAMEs to `secure-pride.pages.dev`. That Pages deployment was still serving the previous scanner: a dark page, and a `/api/scan` body with no `engine` field. `main` already contains the porcelain page and the Rust WASM route.

The connected Cloudflare account can list Workers and the zone. It cannot read the Pages project or Workers Builds (HTTP 403). A Git-connected Workers Build cannot be created with this connection.

## Options

**A. Deploy the existing Pages project with Wrangler.** The Pages API is not authorized on this connection, so the stale project cannot be updated from here.

**B. Compile `functions/` into one Worker and serve `dist/` as static assets.** Same routes, same `_headers`, no new framework. **Chosen.**

**C. Move the site onto the Astro Cloudflare adapter.** The site is a static build. The adapter would replace the file-based functions for no gain.

## Decision

`wrangler.toml` names the Worker `secure-pride`. `compatibility_date` stays `2026-08-10`. `npm run build` still writes `dist/` and `dist/_headers`. `npm run build:worker` compiles `functions/` to `.worker-build/index.js`, which is gitignored. `npm run deploy` runs both and then `wrangler deploy`.

Static requests, including the hashed CSP in `dist/_headers`, are served by the asset layer. Only `/api/*` runs the Worker (`assets.run_worker_first`). The asset binding is `ASSETS`, which is what the compiled functions fall back to.

`NODE_VERSION` is not a runtime variable. It was a Pages build hint and is not read by the functions.

Workers Logs and traces stay off. A newly created Worker enables Workers Logs unless the config says otherwise, and an invocation log includes the request. `wrangler.toml` sets `[observability] enabled = false`, which also leaves logs disabled. `/api/scan` receives drafts. The audit line is still the existing `console.log` of hashed actor, classifications, and length, and it does not include the submitted text.

`SP_AUDIT_SALT` is not set by this change. The function already hashes with its built-in salt when the binding is absent. A production salt, if one was set on Pages, has to be added as a Worker secret by someone who already holds it. It is not written into the repo.

The Pages project is not deleted. Rollback is not a CNAME change by itself. Remove the Worker custom domains for both hostnames, then point `securepride.org` and `www.securepride.org` back at `secure-pride.pages.dev`. A Pages custom domain becomes inactive when its DNS record points somewhere else, and requests fail until that domain is active again, so reactivate both Pages custom domains after the records point back. Rollback is complete only after both hostnames serve the Pages deployment.

## Verification

`npm run build && npm run build:worker`, then `wrangler deploy`. On the Worker URL, `/tools/scanner/` is the porcelain page and `POST /api/scan` with `{"text":"Hello"}` returns `engine: "scanner-rs"`. Read the deployed Worker settings and confirm observability is disabled before any hostname moves.

Cloudflare will not attach a Worker custom domain to a hostname that already has a CNAME. Both hostnames currently CNAME to `secure-pride.pages.dev`. Delete those two records, then attach `securepride.org` and `www.securepride.org` as custom domains. The public site does not answer on those hostnames between the deletion and the new records becoming active. Confirm the Worker URL before deleting the records.

## Outcome update — 2026-11-14

The Cloudflare dashboard now lists `securepride.org` and
`www.securepride.org` as production custom domains on `secure-pride`.
The Worker still served manually deployed version `d4add5dc` at setup.

The founder requested GitHub deployment and approved creating Cloudflare's
automatic build token after its broad account-wide permissions were
displayed. Workers Builds is now connected to `Secure-Pride/secure-pride`,
production branch `main`, root `/`. It runs
`npm run build && npm run build:worker`, then `npx wrangler deploy`.
Preview builds and build caching are disabled.

This supersedes the earlier connection-specific inability to configure
Workers Builds. The hosting architecture and compatibility date are
unchanged. The token is dedicated by name, not Worker-scoped; its scope is
a recorded trade-off. No token value is stored here.

The connection was saved successfully. A Git-triggered build has not yet
been verified. Logs, traces, Issues, and Logpush are off in the observed
Worker settings. Runtime variables and secrets were empty.

See [the deployment runbook](../DEPLOYMENT.md) for release checks, rollback,
alternate-hostname exposure, and the dated Cloudflare follow-up list.

## Hardening outcome — 2026-11-14

The founder approved the configuration follow-ups. The multi-provider and
multi-signer DNS options were disabled while DNSSEC stayed enabled. Public
validation returned authenticated answers before and after; the earlier
warning was a configuration inconsistency, not a demonstrated outage.

Both alternate Worker URL switches were disabled and verified with HTTP 404
responses. Wrangler now declares `workers_dev = false` and
`preview_urls = false` so subsequent deployments preserve the restriction.
Custom domains remain attached and return healthy responses.

The existing leaked-password condition was first deployed as an active
Block custom rule. Only after that rule was active was the single rate-limit
slot repurposed for `POST /api/scan` and `/api/scan/` on both production
hostnames: 10 requests per 10 seconds per IP, blocked for 10 seconds. This
keeps credential protection while adding a short scanner burst control.
The short window limits shared-IP lockout duration. A synthetic burst
produced 429 responses; counters are approximate, not a strict quota.

The dedicated build token remains account-wide. Its replacement requires a
separate verified credential migration. Minimum TLS and HSTS scope remain
unchanged because client and subdomain compatibility have not been assessed.

A follow-up POST check found that the WWW-to-apex redirect used 301, which
can rewrite POST to GET. The zone rule now uses 308 while retaining its
path and query behavior. A method-preserving follow returned HTTP 200 from
the Rust scanner. The repository's static redirect fallback is aligned to
308 as well. The first save attempt stopped at Cloudflare's proxy warning;
verification caught the unchanged 301, and the deployment was completed
before the successful 308 check.
