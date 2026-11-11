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

Workers Logs and traces stay off. `/api/scan` receives drafts. The audit line is still the existing `console.log` of hashed actor, classifications, and length, and it does not include the submitted text. Turning on request logging would store those drafts.

`SP_AUDIT_SALT` is not set by this change. The function already hashes with its built-in salt when the binding is absent. A production salt, if one was set on Pages, has to be added as a Worker secret by someone who already holds it. It is not written into the repo.

The Pages project is not deleted. Rollback is to point the two CNAMEs back at `secure-pride.pages.dev`.

## Verification

`npm run build && npm run build:worker`, then `wrangler deploy`. On the Worker URL, `/tools/scanner/` is the porcelain page and `POST /api/scan` with `{"text":"Hello"}` returns `engine: "scanner-rs"`. After that check, attach `securepride.org` and `www.securepride.org` as custom domains.
