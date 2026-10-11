# Wi-Fi Enterprise guide — lab verification record

**Guide**: `/tools/wifi-enterprise` · **Guide version**: 0.1.0
**Date**: 2026-10-11 · **Decision**: [DECISION-007](../decisions/DECISION-007.md)
**Files under test**: `src/components/tools/wifi-enterprise/files/` (the page
imports these verbatim, so what was tested is what is published)

## Environment

| Component | Version | Source |
|---|---|---|
| Host OS | Ubuntu 24.04.5 LTS | sandbox |
| step CLI | 0.31.0 | `go install github.com/smallstep/cli/cmd/step@latest` |
| step-ca | 0.30.2 | `CGO_ENABLED=0 go install …/certificates/cmd/step-ca@latest` |
| FreeRADIUS | 3.2.5 (`3.2.5+dfsg-3~ubuntu24.04.3`) | Ubuntu apt |
| eapol_test | 2.10 (`eapoltest` package) | Ubuntu apt |
| OpenSSL | 3.0.13 | Ubuntu |

Not tested here: real access points, real Apple/Windows/Android devices,
WireGuard (no kernel module in the sandbox), `ufw`, and MDM delivery. Those
steps are written from vendor documentation and are labeled as such in
the guide's draft notice.

## Results

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | `step ca init` with `--dns`, `--address`, `--provisioner` | CA created | ✅ |
| 2 | `step ca provisioner update` with default/max duration and `--x509-template` in one call | config updated | ✅ |
| 3 | CRL served by step-ca | DER at `/crl` | ✅ `application/pkix-crl` |
| 4 | Device cert `staff-laptop-07` | CN only, clientAuth EKU, CDP present | ✅ |
| 5 | Server cert `radius.example.internal` | SAN DNS name present (Android Domain match) | ✅ |
| 6 | `refresh-wifi-crl` | fetch, signature-check, install, rehash | ✅ shellcheck clean |
| 7 | `freeradius -XC` with published `eap`, `wifi_vlan`, `clients.conf` | config OK | ✅ |
| 8 | EAP-TLS, `staff-` cert | Accept, VLAN 10 | ✅ `Tunnel-Private-Group-Id = "10"` |
| 9 | EAP-TLS, `volunteer-` cert | Accept, VLAN 20 | ✅ |
| 10 | EAP-TLS, unknown role prefix | Reject | ✅ |
| 11 | Identity ≠ certificate name | Reject (`check_cert_cn`) | ✅ |
| 12 | Certificate from a foreign CA | Reject | ✅ |
| 13 | Supplicant pinned to a different server name | Client refuses (evil-twin case) | ✅ |
| 14 | Access-Request without Message-Authenticator | Discarded (Blast-RADIUS) | ✅ no reply |
| 15 | Revoke by serial → refresh CRL, **no restart** | still accepted | ⚠️ accepted |
| 16 | Same, after `kill -HUP` | still accepted | ⚠️ accepted |
| 17 | Same, after restart | Reject, "certificate revoked" | ✅ |
| 18 | CRL past `nextUpdate` | every login fails | ✅ "CRL has expired" |
| 19 | `step ca renew` on server cert | renewed | ✅ |
| 20 | `ipaddr = 192.168.1.0/24` client block | config OK | ✅ |
| 21 | `log { auth = yes }` | log names device ID + MAC only | ✅ |

## Failures found and fixed before publishing

1. **"different CRL scope" — every login failed.** step-ca adds a critical
   Issuing Distribution Point to its CRL. Certificates had no matching CRL
   Distribution Point, so OpenSSL rejected the CRL as out of scope.
   *Fix*: the provisioner template adds `crlDistributionPoints`, and
   `crl.idpURL` is set to the same URL. Both must be set **before** issuing
   any certificate. The guide's watch-out says so.
2. **Stock `ca_file` trusts the public CA bundle.** FreeRADIUS ships
   `ca_file = /etc/ssl/certs/ca-certificates.crt`. With EAP-TLS that trusts
   any public CA to issue Wi-Fi identities. *Fix*: the published `eap`
   file trusts only the organization's CA.
3. **Stock `clients.conf` includes `localhost` / `testing123`.** Appending a
   second `127.0.0.1` client fails as a duplicate. *Fix*: the guide replaces
   the whole file and gives `localhost` its own secret.
4. **`step ca revoke` has no `--provisioner-password-file`.** The guide uses
   the interactive prompt; the lab minted the same JWK token with
   `step ca token --revoke`.
5. **Revocation is not enforced until FreeRADIUS restarts** (tests 15–17).
   `ca_path_reload_interval = 3600` picks it up within an hour. *Fix*: the
   lost-device runbook ends with `systemctl restart freeradius`.
6. **An expired CRL blocks everyone** (test 18). *Fix*: hourly refresh timer,
   24 h CRL lifetime, and a documented break-glass (`allow_expired_crl`).

## Lab-only adjustments (not in the guide)

- `/etc/hosts` entries and `NO_PROXY` so lab hostnames bypassed the sandbox
  egress proxy.
- IPv6 `listen` blocks removed from the lab copy of `sites-available/default`
  (the sandbox has no IPv6). Real hosts keep them.

## Reproduce

Every command in the guide's command blocks was run in the order the guide
presents them, with `ca.example.internal` mapped to `127.0.0.1`.

## Browser verification (UI)

Driver: `.claude/skills/run-secure-pride/wifi-enterprise/drive.mjs`
(headless Chromium via Playwright, axe-core WCAG 2.1 AA rules). 27/27 passed:

- Intake: empty submit raises an alert and focuses the first unanswered
  question; six answers route to the expected path.
- Paths: remote login server adds the tunnel stage; the not-yet path shows
  only hardening.
- Focus moves to the path heading and to each stage heading on navigation;
  keyboard focus shows a solid 2–3 px outline on every control.
- Toggling a step is announced in a polite live region.
- Nothing is written to browser storage before opt-in. After opt-in, storage
  holds only `{"v":1,"answers":{…option ids…},"done":[…step ids…]}`;
  reload restores it; opting out clears it.
- Markdown export downloads as
  `YYYY-MM-DD_wifi-enterprise-checklist_vX.Y.Z.md` with frontmatter.
- Copy buttons place the exact command text on the clipboard.
- 375 px wide: no horizontal page scroll; every button, label, and summary
  is at least 44 px tall.
- axe-core: zero WCAG 2.1 AA violations on the intake, a guide stage, and
  the not-yet path.
- No network requests beyond the page's own assets; no console errors.

### Pre-existing: the repo's `_headers` CSP would blank every tool page

`_headers` sits at the repo root, but Pages serves only `dist/`, so its CSP
is not live (confirmed against production response headers on 2026-10-11).
Served with that CSP, both `/tools/scanner/` and `/tools/wifi-enterprise/`
render nothing: Astro's inline island scripts, inline styles, and `data:`
fonts all violate it. This guide behaves exactly like the existing scanner.
Deploying `_headers` needs its own change (hashes or nonces, or Astro's
external-script settings) and its own browser test.
