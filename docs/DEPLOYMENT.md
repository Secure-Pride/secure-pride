# Deploy the public site from GitHub

## Current deployment

Configured in the Cloudflare dashboard on **2026-11-14**.

| Setting | Value |
| --- | --- |
| GitHub repository | `Secure-Pride/secure-pride` |
| Worker | `secure-pride` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build && npm run build:worker` |
| Deploy command | `npx wrangler deploy` |
| Preview builds | Disabled |
| Build cache | Disabled |
| Build token | Dedicated token named `secure-pride GitHub build token` |
| Production custom domains | `securepride.org`, `www.securepride.org` |
| Runtime compatibility date | `2026-08-10` |

The Git connection is saved. Its first successful Git-triggered production
build has **not yet been verified**. At setup, production still served the
previous manually deployed Worker version `d4add5dc`.

The Node build version is declared in [`.nvmrc`](../.nvmrc), currently
`24.19.0`. This is separate from the Worker's compatibility date.
No build variables or secrets were configured in the dashboard at setup.

## Release through a pull request

1. Open a pull request against `main`.
2. Wait for the repository's required `validate` check and resolve review threads.
3. Review the diff, then merge through GitHub's normal protected-branch flow.
4. Open Cloudflare → Workers & Pages → `secure-pride` → Deployments.
5. Confirm the Git-triggered build uses the merged commit.
6. Confirm both build stages succeed, deployment succeeds, and the new
   version receives production traffic.
7. Run the smoke checks below.

Every push to `main` triggers the configured build and deploy commands.
Cloudflare's build command does not itself run tests or wait for a separate
GitHub Actions run. The protected pull-request workflow is the release gate.
Feature-branch pushes do not create Cloudflare preview builds.

The current GitHub ruleset requires `validate`, pull requests, and resolved
review threads. It does not require an approving review and does not require
the branch to be current with `main`. These are observed settings, not claims
that every security check is required.

## What the build produces

- `npm run build` generates the Astro site in `dist/`, then creates
  `dist/_headers`, including the generated Content-Security-Policy.
- `npm run build:worker` compiles `functions/` to
  `.worker-build/index.js`.
- Wrangler deploys that entry point and `dist/` using
  [`wrangler.toml`](../wrangler.toml).
- Static assets use the `ASSETS` binding. Only `/api/*` runs the Worker first.
- The Rust scanner's WASM package is committed under
  `functions/_lib/scanner/pkg/`; this deployment command does not rebuild Rust.
  Changes to the Rust engine must follow the scanner verification workflow.

Do not remove `build:worker` from the build command. A static Astro build alone
does not generate the configured Worker entry point.

## Smoke checks

Use invented input only. Never paste a real draft, credential, or personal
record into a deployment check.

```bash
curl --fail-with-body --silent --show-error https://securepride.org/api/health
curl --fail-with-body --silent --show-error https://www.securepride.org/api/health
curl --fail-with-body --silent --show-error \
  --header 'Content-Type: application/json' \
  --data '{"text":"Hello"}' \
  https://securepride.org/api/scan
curl --silent --show-error --head https://securepride.org/tools/scanner/
```

Expected health body: `{"status":"ok","service":"secure-pride-dlp"}`.
The scan response must identify `engine: "scanner-rs"`; HTTP 200 alone
does not verify the engine. Open the scanner page and check an invented
example manually. Inspect the response headers for the generated CSP.

Check Worker Settings after deployment: Logs, Traces, Issues, and Logpush
should remain disabled. No Tail Worker or telemetry export was configured
at setup. Disabled Worker logs do not mean that Cloudflare collects no
platform metrics or security events.

## Credentials and exposure

The founder explicitly approved Cloudflare's automatic build token.
It is dedicated by name, **not restricted to this Worker**. The displayed
permissions include editing Workers and several storage services across the
account, Workers Routes for all account zones, and account/user reads.

Keep the credential inside Cloudflare Builds. Never commit or copy its value
into documentation. Review scope and lifetime in the token owner’s profile.
A narrower deployment credential is follow-up work; do not revoke the
working credential until its replacement has deployed successfully.

Runtime secrets belong in Worker Settings → Runtime variables and secrets,
not build variables. At setup, no runtime variables or secrets were listed,
including `SP_AUDIT_SALT`. The scanner therefore uses its source-defined
fallback salt. This does not block deployment. Do not enable persistent
logging to compensate, and do not copy an unknown Pages secret.

The production `workers.dev` URL and version preview URLs remain enabled and
public at setup. Disabling preview **builds** does not disable preview
**URLs**. Review these alternate entry points before relying on zone-scoped
security rules. If disabling `workers.dev`, also set `workers_dev = false`
in Wrangler so a later deployment does not restore it.

## Observed Cloudflare follow-ups

These are observations from **2026-11-14**, not changes applied by this guide.

| Area | Observed | Next action |
| --- | --- | --- |
| Scanner rate limiting | The zone's one available rate-limit rule is used by `Leaked credential check`, matching `cf.waf.credential_check.password_leaked`. No scanner-path rate-limit rule is listed. | Design a limit for `POST /api/scan`, account for shared-IP users, and test alternate hostnames. Review the existing rule before replacing it. |
| DNSSEC | Dashboard says protected, but both multi-provider DNS and multi-signer DNSSEC are enabled; it also warns these cannot validate on a Cloudflare Registrar domain. | Independently validate the delegation and DNSSEC chain; reconcile these settings with any intentional secondary provider. Preserve DNSSEC. |
| Transport | Certificates active; Always Use HTTPS and TLS 1.3 enabled; minimum TLS 1.2. HSTS is on for one month, without subdomains or preload. | Reconcile the TLS 1.3-only policy with actual client compatibility. Review every subdomain before expanding HSTS. |
| Build verification | Connection saved; no Git-triggered deployment verified at setup. | Verify the first merge-to-deploy cycle and record the commit, build result, and version. |

## Failure and rollback

If the build fails, inspect its dependency-install, build, or deploy stage.
Confirm the Node version, repository root, Worker name, entry point,
and both build commands. Do not report a saved Git connection as a passing
deployment.

If a released version fails smoke checks, use Cloudflare Deployments to
roll back to the last known-good version. Re-run health and scanner checks
on both custom domains. Revert the bad commit through a pull request so a
later push does not reintroduce it. If necessary, pause automatic builds
while investigating, then restore them after the correction.

Keep the historical Pages rollback procedure in
[DECISION-015](decisions/DECISION-015.md) as a separate disaster-recovery
path. A Worker version rollback does not require DNS changes.

## References

- [Worker hosting decision](decisions/DECISION-015.md)
- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Production and preview branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [workers.dev configuration](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
