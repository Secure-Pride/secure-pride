/* ─── Stages 7–9: verify, switch over, keep it healthy ──────────────────
   The revoke → refresh → restart sequence below mirrors lab tests 15–17
   (docs/guides/wifi-enterprise-lab-verification.md): FreeRADIUS does not
   enforce a new revocation until restart or the hourly ca_path reload. */

import type { Stage } from "../types";

const NOT_YET = { none: ["path:not-yet" as const] };

/** Pure: the revoke → refresh → restart routine for one device name. */
function revokeCommands(device: string, reason: string): string {
  return [
    `D=${device}`,
    'SERIAL=$(step certificate inspect "$D.crt" --format json | jq -r .serial_number)',
    `step ca revoke "$SERIAL" --reason "${reason}"`,
    "sudo systemctl start refresh-wifi-crl.service",
    "sudo systemctl restart freeradius",
  ].join("\n");
}

export const VERIFY_STAGE: Stage = {
  id: "verify",
  title: "Prove it works before switching",
  summary:
    "Test the failures, not just the success. A network that lets the wrong device in is worse than none.",
  when: NOT_YET,
  steps: [
    {
      id: "verify-join",
      title: "Check one device lands in the right segment",
      why: "A wrong VLAN number silently puts a device in the wrong place.",
      actions: [
        "Join the new Wi-Fi with one enrolled staff device.",
        "Check its address is in the Staff network's range.",
        "Check the login log names the device, not a person.",
      ],
      commands: [{ label: "Login log", code: "sudo tail -n 5 /var/log/freeradius/radius.log" }],
      doneWhen: "The log shows “Login OK: [staff-…]” and the device has a Staff address.",
      minutes: 15,
    },
    {
      id: "verify-revoke",
      title: "Revoke the practice certificate and watch it fail",
      why: "This is the most important test. It proves you can lock out a lost device.",
      actions: [
        "Revoke staff-test-01. Enter the provisioner password when asked.",
        "Refresh the list and restart FreeRADIUS.",
        "Re-run the login test from the “Build the login server” stage.",
      ],
      commands: [{ label: "Revoke", code: revokeCommands("staff-test-01", "practice") }],
      doneWhen: "The test prints FAILURE, and the log says “certificate revoked”.",
      watchOut:
        "Without the restart, the revoked device keeps working for up to an hour. We confirmed this in testing.",
      minutes: 15,
    },
    {
      id: "verify-refuse",
      title: "Confirm the wrong things are refused",
      why: "Segments only protect you if the walls hold.",
      actions: [
        "Try joining with a device that has no certificate. It must fail.",
        "From a Volunteer device, try opening something on the Staff network. It must fail.",
        "On each device profile, confirm the server name and root CA are set.",
      ],
      doneWhen: "All three checks behave as described.",
      minutes: 20,
    },
    {
      id: "verify-breakglass",
      title: "Write down your break-glass plan",
      why: "When something breaks on a busy day, you won't want to think. Decide now.",
      actions: [
        "If the login server dies: turn the old Wi-Fi back on until it's fixed.",
        "If the CA was down and the list expired: add allow_expired_crl = yes under check_crl, restart, fix the CA, then remove it.",
        "Save these steps in your password manager next to the secrets.",
      ],
      doneWhen: "The plan is saved where the next person can find it.",
      minutes: 15,
    },
  ],
};

export const CUTOVER_STAGE: Stage = {
  id: "cutover",
  title: "Switch everyone over",
  summary: "Move people in batches, then retire the shared password.",
  when: NOT_YET,
  steps: [
    {
      id: "cutover-move",
      title: "Enroll everyone",
      why: "Batches keep problems small and easy to trace.",
      actions: [
        "Enroll staff first, then volunteers, then devices.",
        "Mark each device enrolled on your list.",
      ],
      doneWhen: "Every device on your list is enrolled or moved to the devices-only network.",
      minutes: 120,
    },
    {
      id: "cutover-retire",
      title: "Retire the old shared password",
      why: "The old password is still known to everyone who ever had it.",
      actions: [
        "Turn off the old Wi-Fi name on your switch-over day.",
        "If you keep it for devices, give it a new long password and put it on VLAN 30.",
      ],
      doneWhen: "The old Wi-Fi name and password no longer work.",
      minutes: 15,
    },
  ],
};

export const MAINTAIN_STAGE: Stage = {
  id: "maintain",
  title: "Keep it healthy",
  summary: "About one hour a month. Put a recurring reminder on the maintainer's calendar.",
  when: NOT_YET,
  steps: [
    {
      id: "maintain-offboard",
      title: "Learn the lost-device routine",
      why: "When someone leaves or loses a device, act the same day.",
      actions: [
        "Find the device's .crt file and name.",
        "Revoke it, refresh the list, and restart FreeRADIUS.",
        "Remove the device from your list.",
      ],
      commands: [{ label: "Revoke a device", code: revokeCommands("staff-laptop-07", "device lost") }],
      doneWhen: "You've saved this routine where the next maintainer will find it.",
      minutes: 10,
    },
    {
      id: "maintain-monthly",
      title: "Do the monthly check",
      why: "Small checks prevent the two big outages: expired certificates and an expired list.",
      actions: [
        "Confirm the hourly refresh ran recently.",
        "Install system updates on the login-server computer.",
        "Check access-point firmware updates.",
        "Note any certificates expiring in the next 60 days.",
      ],
      commands: [
        {
          label: "Monthly check",
          code: [
            "systemctl list-timers refresh-wifi-crl.timer",
            "sudo openssl crl -in /etc/freeradius/3.0/certs/wifi/ca.d/crl.pem -noout -nextupdate",
            "sudo apt update && sudo apt upgrade",
            "for c in *.crt; do echo \"$c $(step certificate inspect \"$c\" --format json | jq -r .validity.end)\"; done",
          ].join("\n"),
        },
      ],
      doneWhen: "The timer ran within the last hour, and the expiry list is on your calendar.",
      minutes: 30,
    },
    {
      id: "maintain-renew",
      title: "Renew certificates before they expire",
      why: "Certificates last one year. An expired server certificate stops everyone at once.",
      actions: [
        "Renew the server certificate a month before it expires, then restart FreeRADIUS.",
        "For devices, issue and install a fresh certificate the same way as enrollment.",
      ],
      commands: [
        {
          label: "Renew the server certificate",
          code: [
            "W=/etc/freeradius/3.0/certs/wifi",
            'sudo cp "$W/server.crt" "$W/server.key" .',
            "sudo chown \"$USER\" server.crt server.key",
            "step ca renew --force server.crt server.key",
            'sudo install -o freerad -g freerad -m 640 server.crt server.key "$W/"',
            "shred -u server.key",
            "sudo systemctl restart freeradius",
          ].join("\n"),
        },
      ],
      doneWhen: "The server certificate's expiry is a year away.",
      minutes: 20,
    },
    {
      id: "maintain-secrets",
      title: "Rotate shared secrets once a year",
      why: "Anyone who saw a secret keeps knowing it.",
      actions: [
        "Generate new access-point secrets in your password manager.",
        "Update clients.conf and each access point at the same time, then restart FreeRADIUS.",
        "Rotate sooner if someone with access leaves.",
      ],
      doneWhen: "Every access point uses a secret created in the last year.",
      minutes: 30,
    },
  ],
};
