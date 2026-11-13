# DECISION-016: Harden the public API, audit salt, and security.txt

**Status**: Accepted, directed by the founder (approved a code PR for the 13 November 2026 security review).
**Date**: 2026-11-13
**Category**: Security
**Decision ID**: DECISION-016
**Authority**: Tier 2 (security headers and audit metadata). Documented in the same pull request as the change.

## Context

A read-only review of the Worker and securepride.org, after the DECISION-015 cutover, found several code issues:

- There was no `/.well-known/security.txt`, even though SECURITY.md and `/security/` already describe how to report a vulnerability.
- `SP_AUDIT_SALT` was not set on the Worker. `logScan` hashed actor IDs with a default salt that is public in the repository, and `/api/scan` accepted a client-supplied `actor_id`.
- `/api/*` runs in the Worker (`run_worker_first`), so `dist/_headers` does not apply. Scan and health responses lacked `Cache-Control: no-store` and the other security headers. The contact route already set `no-store`.
- `/api/scan` called `request.json()` before checking body size. Only `body.text` was capped at 50,000 characters, and a chunked or oversized JSON body could still be parsed in full.

DECISION-015 said the function would hash with its built-in salt when the binding was absent. That default is no longer acceptable.

## Options considered

**Audit salt**

- A. Keep the public default salt so every scan still writes an audit line. Rejected: common actor IDs are easy to confirm against a public salt.
- B. Fail the scan when the salt is missing. Rejected: the public scanner should keep working without a secret, and this review does not set secrets.
- C. Remove the default salt. If the secret is missing, skip the hashed-actor audit line and log nothing identifying. The scan still returns results. Chosen.

**API headers and body cap**

- Apply a shared header helper on every `/api/*` response, including errors and 404/405, rather than setting headers only on success paths.
- Reject `/api/scan` bodies over 100 KiB. If `Content-Length` is present and too large, return 413 without reading. If it is missing (chunked), read with the same byte cap.

## Decision

1. Publish `public/.well-known/security.txt` (RFC 9116) with the GitHub private advisory URL as the first Contact field, the email address as the second, and a link to `/security/`. RFC 9116 treats the first contact as preferred, which matches the security policy.
2. Remove the public default audit salt. `hashActor` requires a salt. `logScan` writes a line only when `SP_AUDIT_SALT` is set. The public `/api/scan` route always uses the actor id `anonymous` and ignores any client-supplied `actor_id`.
3. Every `/api/*` response, including errors and 404/405, sets `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Cross-Origin-Resource-Policy: same-origin`, and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. If a handler throws, the middleware returns a generic 500 JSON error with those headers and does not include the exception text.
4. `/api/scan` rejects a body larger than 100 KiB with a generic 413 JSON error before parsing JSON.
5. The privacy page describes the Rust scanner (`scanner-rs`) and the salt-dependent audit line.

`SP_AUDIT_SALT` is still not stored in the repository. It must be set as a Worker secret by the founder (`npx wrangler secret put SP_AUDIT_SALT`). This change does not set that secret or deploy.

The HSTS ramp in DECISION-012 is unchanged.

## Verification

```
npm run check:tokens
npx tsc --noEmit
npm test
npm run build
```

Confirm `dist/.well-known/security.txt` is in the static build output.

## Rollback

Revert the pull request and redeploy. No Cloudflare zone change is required for rollback of these code changes.
