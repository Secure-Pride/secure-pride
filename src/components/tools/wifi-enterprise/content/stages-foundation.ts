/* ─── Stages 1–2: plan, then build the certificate authority ──────────── */

import type { Stage } from "../types";
import deviceTemplate from "../files/wifi-device.tpl?raw";

const NOT_YET = { none: ["path:not-yet" as const] };

export const PLAN_STAGE: Stage = {
  id: "plan",
  title: "Plan before you touch anything",
  summary:
    "Decide your network segments, device names, and where secrets live. Nothing changes on your network yet.",
  when: NOT_YET,
  steps: [
    {
      id: "plan-check-ap",
      title: "Confirm your access points can do this",
      why: "Everything else depends on it. Some business access points still lack these features.",
      actions: [
        "Find the model number on the access point's label or admin page.",
        "Search the maker's documentation for that model plus “WPA2-Enterprise”.",
        "Also look for “RADIUS-assigned VLAN” or “dynamic VLAN”.",
        "If either is missing, restart the questions and choose “home or internet-provider router”.",
      ],
      doneWhen: "You know the model, and the maker confirms both features.",
      minutes: 20,
      when: { all: ["ap:unknown"] },
    },
    {
      id: "plan-segments",
      title: "Choose three network segments",
      why: "Each device lands in a segment based on its certificate. One stolen device can't reach everything.",
      actions: [
        "Staff (VLAN 10): full access to shared drives and printers.",
        "Volunteers (VLAN 20): internet, plus only what volunteers need.",
        "Devices (VLAN 30): printers, TVs, and smart devices. Internet only.",
        "Create these three networks on your router or gateway.",
        "Block Volunteers and Devices from reaching the Staff network.",
      ],
      doneWhen: "Three networks exist with the VLAN numbers you chose, and the blocking rules are saved.",
      watchOut:
        "Write down the VLAN numbers. The login server and access points must use the same ones.",
      minutes: 45,
    },
    {
      id: "plan-names",
      title: "Name devices by role, never by person",
      why: "Certificate names show up in logs. A role-based name keeps who-is-who off the server.",
      actions: [
        "Use role-type-number: staff-laptop-07, volunteer-phone-03, iot-printer-01.",
        "Never use legal names, chosen names, initials, or pronouns.",
        "Keep the device-to-person list in your password manager only.",
      ],
      doneWhen: "Your naming rule is written down, and the device list exists in your password manager.",
      watchOut:
        "The name must start with staff-, volunteer-, or iot-. The login server uses that prefix to choose the segment, and rejects anything else.",
      minutes: 15,
    },
    {
      id: "plan-secrets",
      title: "Make password-manager entries now",
      why: "You will create several secrets. Saving each one as you go prevents lock-outs.",
      actions: [
        "Create an entry for the certificate authority password.",
        "Create an entry for the provisioner password (used to issue certificates).",
        "Create one entry per access point for its login-server secret. Generate 40 random characters.",
        "Create a folder for device certificate export passwords.",
      ],
      doneWhen: "The entries exist, even if some are still empty.",
      minutes: 10,
    },
    {
      id: "plan-host",
      title: "Pick an always-on computer for the login server",
      why: "If this computer is off, nobody can join Wi-Fi.",
      actions: [
        "Use a small computer running Debian or Ubuntu: a mini PC or Raspberry Pi 4 or 5.",
        "Connect it by cable, not Wi-Fi.",
        "Give it a fixed address on the Staff network.",
        "Plug it into a battery backup if you can.",
        "Do not use anyone's laptop.",
      ],
      doneWhen: "The computer runs Debian or Ubuntu, is wired, and keeps the same address after a restart.",
      minutes: 60,
      when: { all: ["radius:new-host"] },
    },
    {
      id: "plan-keep-old",
      title: "Keep your current Wi-Fi running",
      why: "You will build the new network beside the old one. Nobody loses access while you work.",
      actions: [
        "Leave your current Wi-Fi name and password alone until the “Switch over” stage.",
        "Pick a tentative switch-over day at least a week out.",
      ],
      doneWhen: "A switch-over day is on the calendar.",
      minutes: 5,
    },
  ],
};

export const CA_STAGE: Stage = {
  id: "ca",
  title: "Build your certificate authority",
  summary:
    "A certificate authority (CA) issues each device its own ID card. You run your own, with step-ca.",
  when: NOT_YET,
  steps: [
    {
      id: "ca-install",
      title: "Install step and step-ca on the login-server computer",
      why: "Running the CA beside the login server keeps it off the network entirely.",
      actions: [
        "Follow Smallstep's install page for Debian or Ubuntu.",
        "Install jq and curl too. Later steps use them.",
      ],
      commands: [
        {
          label: "Check both installed",
          code: "step version\nstep-ca version\nsudo apt install jq curl",
        },
      ],
      doneWhen: "Both commands print a version number.",
      minutes: 20,
      reference: {
        label: "Smallstep: install step-ca",
        href: "https://smallstep.com/docs/step-ca/installation/",
      },
    },
    {
      id: "ca-init",
      title: "Create the CA",
      why: "This makes the root and the everyday signing key your devices will trust.",
      actions: [
        "Run the command below. Replace the example names first.",
        "When asked, paste the CA password from your password manager.",
        "When asked for the provisioner password, use that entry.",
        "Add the CA name to this computer's hosts file so it only listens locally.",
      ],
      commands: [
        {
          label: "On the login-server computer",
          code: [
            'step ca init --name "Your Org Wi-Fi CA" \\',
            "  --dns ca.example.internal \\",
            "  --address 127.0.0.1:9443 \\",
            "  --provisioner wifi-admin",
            "",
            'echo "127.0.0.1 ca.example.internal" | sudo tee -a /etc/hosts',
          ].join("\n"),
        },
      ],
      doneWhen: "The command ends with “Your PKI is ready to go.”",
      watchOut:
        "Use this CA only for Wi-Fi. Any certificate it signs can join your network.",
      minutes: 15,
    },
    {
      id: "ca-template",
      title: "Set certificate lifetime and revocation — before issuing anything",
      why: "This lets the login server reject lost devices. Order matters: certificates issued earlier won't work with revocation.",
      actions: [
        "Save the template below as $(step path)/templates/wifi-device.tpl.",
        "Replace ca.example.internal in it with your CA name.",
        "Run the commands. They set one-year certificates and turn on the revocation list.",
        "Restart step-ca to load the changes.",
      ],
      commands: [
        { label: "Template file: $(step path)/templates/wifi-device.tpl", code: deviceTemplate.trimEnd() },
        {
          label: "Apply it",
          code: [
            "step ca provisioner update wifi-admin \\",
            "  --x509-default-dur 8760h --x509-max-dur 8760h \\",
            '  --x509-template "$(step path)/templates/wifi-device.tpl"',
            "",
            'CFG="$(step path)/config/ca.json"',
            "jq '.crl = {\"enabled\": true, \"generateOnRevoke\": true, \"cacheDuration\": \"24h\", \"idpURL\": \"https://ca.example.internal:9443/crl\"}' \\",
            '  "$CFG" > "$CFG.new" && mv "$CFG.new" "$CFG"',
            "",
            'jq .crl "$CFG"',
          ].join("\n"),
        },
      ],
      doneWhen: "The last command shows enabled: true and your idpURL.",
      watchOut:
        "The URL in the template and idpURL must match exactly. If they differ, every login fails with “different CRL scope.” We found this in testing.",
      minutes: 20,
    },
    {
      id: "ca-service",
      title: "Run step-ca as a service",
      why: "It must restart by itself after a power cut.",
      actions: [
        "Set up the systemd service from Smallstep's repository.",
        "Check that the CA answers.",
      ],
      commands: [
        {
          label: "Health check",
          code: 'curl --cacert "$(step path)/certs/root_ca.crt" \\\n  https://ca.example.internal:9443/health',
        },
      ],
      doneWhen: "The health check prints {\"status\":\"ok\"}, and still does after a reboot.",
      minutes: 30,
      reference: {
        label: "step-ca systemd setup",
        href: "https://github.com/smallstep/certificates/tree/master/systemd",
      },
    },
    {
      id: "ca-root-offline",
      title: "Move the root key off this computer",
      why: "The root key is only needed to replace the signing key. Offline, it can't be stolen with the computer.",
      actions: [
        "Copy the root key file to two encrypted USB drives, or attach it to your password manager.",
        "Confirm a copy opens.",
        "Then delete it from this computer.",
      ],
      commands: [
        {
          label: "After both copies are verified",
          code: 'ls "$(step path)/secrets/"\nshred -u "$(step path)/secrets/root_ca_key"',
        },
      ],
      doneWhen: "root_ca_key is gone from this computer, and two copies exist elsewhere.",
      watchOut:
        "Keep intermediate_ca_key. step-ca needs it to sign certificates.",
      minutes: 20,
    },
  ],
};
