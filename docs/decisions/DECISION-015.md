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

`SP_AUDIT_SALT` is not set by this change. A production salt, if one was set on Pages, has to be added as a Worker secret by someone who already holds it. It is not written into the repo. DECISION-016 later removed the built-in default salt: if the secret is missing, the scan still runs and no hashed-actor audit line is written.

The Pages project is not deleted. Rollback is not a CNAME change by itself. Remove the Worker custom domains for both hostnames, then point `securepride.org` and `www.securepride.org` back at `secure-pride.pages.dev`. A Pages custom domain becomes inactive when its DNS record points somewhere else, and requests fail until that domain is active again, so reactivate both Pages custom domains after the records point back. Rollback is complete only after both hostnames serve the Pages deployment.

## Verification

`npm run build && npm run build:worker`, then `wrangler deploy`. On the Worker URL, `/tools/scanner/` is the porcelain page and `POST /api/scan` with `{"text":"Hello"}` returns `engine: "scanner-rs"`. Read the deployed Worker settings and confirm observability is disabled before any hostname moves.

Cloudflare will not attach a Worker custom domain to a hostname that already has a CNAME. Both hostnames currently CNAME to `secure-pride.pages.dev`. Delete those two records, then attach `securepride.org` and `www.securepride.org` as custom domains. The public site does not answer on those hostnames between the deletion and the new records becoming active. Confirm the Worker URL before deleting the records.
