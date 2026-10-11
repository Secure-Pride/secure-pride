/* ─── Stage 6: enroll devices ────────────────────────────────────────────
   Platform steps appear only for the platforms chosen in the intake.
   Apple gets a manual route (no MDM, or personal devices) and an MDM
   route; personal devices never go through MDM (DECISION-007). */

import type { Stage } from "../types";

export const ENROLL_STAGE: Stage = {
  id: "enroll",
  title: "Give each device its own certificate",
  summary:
    "One certificate per device, named by role. Start with one device of each kind before doing everyone.",
  when: { none: ["path:not-yet"] },
  steps: [
    {
      id: "enroll-issue",
      title: "Issue and package a device certificate",
      why: "Each device gets its own ID, so you can remove one without touching the rest.",
      actions: [
        "Pick the next name from your naming rule. Add it to the device list in your password manager.",
        "Issue the certificate. Enter the provisioner password when asked.",
        "Package it as a .p12 file. Save its export password in your password manager.",
        "Delete the loose key file. Keep the .crt file — you need it to revoke the device later.",
      ],
      commands: [
        {
          label: "For each device",
          code: [
            "D=staff-laptop-07",
            'step ca certificate "$D" "$D.crt" "$D.key"',
            'step certificate p12 "$D.p12" "$D.crt" "$D.key" \\',
            '  --ca "$(step path)/certs/root_ca.crt"',
            'shred -u "$D.key"',
          ].join("\n"),
        },
      ],
      doneWhen: "You have the device's .p12 and .crt files, and its password is saved.",
      watchOut:
        "Hand .p12 files over in person, by AirDrop, or by encrypted transfer. Never by email. If an older device rejects the file, rebuild it with --legacy added.",
      minutes: 10,
    },
    {
      id: "enroll-apple-manual",
      title: "Install on a Mac, iPhone, or iPad (by hand)",
      why: "A small profile installs the certificate and the Wi-Fi settings together, so nobody types anything.",
      actions: [
        "On a Mac, open Apple Configurator (free). Create a new profile.",
        "Certificates: add root_ca.crt and the device's .p12 (with its password).",
        "Wi-Fi: enter your new network name. Choose WPA2/WPA3 Enterprise and the TLS protocol.",
        "Set the identity certificate to the .p12 and the username to the device name.",
        "Under Trust, tick your root CA and add radius.example.internal as the trusted server name.",
        "Save the profile and install it on that one device.",
      ],
      doneWhen: "The device joins the new Wi-Fi without asking for a password.",
      watchOut:
        "The trusted server name is what stops a fake access point. Never leave it blank.",
      minutes: 15,
      reference: {
        label: "Apple Configurator: profiles",
        href: "https://support.apple.com/guide/apple-configurator-mac/cadef0665e3d/mac",
      },
      when: {
        all: ["platform:apple"],
        any: ["path:manual", "devices:personal"],
      },
    },
    {
      id: "enroll-apple-mdm",
      title: "Deliver to organization Apple devices with MDM",
      why: "Your MDM pushes the same settings to every organization device.",
      actions: [
        "Create a profile with a certificate payload containing root_ca.crt.",
        "Add the device's .p12 as its identity certificate, scoped to that one device.",
        "Add a Wi-Fi payload: EAP-TLS, username set to the device name.",
        "In the Wi-Fi payload's trust settings, choose your root CA and add radius.example.internal.",
        "Send it to one test device first.",
      ],
      doneWhen: "The test device joins the new Wi-Fi without a prompt.",
      watchOut:
        "Later, you can automate certificates with SCEP or ACME. Get the manual flow working first.",
      minutes: 30,
      when: { all: ["platform:apple", "path:managed"] },
    },
    {
      id: "enroll-windows",
      title: "Install on Windows",
      why: "Windows needs the certificate, the root CA, and a network profile that checks the server.",
      actions: [
        "Double-click the .p12. Choose Current User and enter its password.",
        "Double-click root_ca.crt. Install it into Trusted Root Certification Authorities.",
        "Open Control Panel → Network and Sharing Center → Set up a new connection → Manually connect to a wireless network.",
        "Enter the network name. Choose WPA2-Enterprise, then open the connection's settings.",
        "Choose “Smart Card or other certificate”, then open Settings.",
        "Tick “Verify the server's identity”, enter radius.example.internal, and tick your root CA.",
      ],
      doneWhen: "The laptop joins the new Wi-Fi and stays connected after a restart.",
      watchOut:
        "Wording differs between Windows versions. The two settings that matter are the server name and your root CA.",
      minutes: 20,
      when: { all: ["platform:windows"] },
    },
    {
      id: "enroll-android",
      title: "Install on Android",
      why: "Android 11 and newer require a CA and a domain. That protects against fake networks.",
      actions: [
        "Copy the .p12 and root_ca.crt to the phone.",
        "Settings → Security → Encryption & credentials → Install a certificate.",
        "Install root_ca.crt as a CA certificate, and the .p12 as a Wi-Fi certificate.",
        "Add the new Wi-Fi network. Choose WPA2/WPA3-Enterprise, then EAP method TLS.",
        "CA certificate: your root. Domain: radius.example.internal.",
        "User certificate: the one you installed. Identity: the device name.",
      ],
      doneWhen: "The phone joins the new Wi-Fi without a password prompt.",
      watchOut:
        "Menu names vary by phone maker. Search Settings for “certificate” if the path differs.",
      minutes: 15,
      when: { all: ["platform:android"] },
    },
    {
      id: "enroll-other",
      title: "Handle Linux, ChromeOS, printers, and smart devices",
      why: "Laptops can usually do EAP-TLS. Many printers and smart devices cannot.",
      actions: [
        "Linux and ChromeOS: add a Wi-Fi network with EAP-TLS, your root CA, the server name, and the .p12.",
        "Printers and smart devices: check the manual for “802.1X” or “EAP-TLS”.",
        "If a device can't do it, keep it on a separate devices-only Wi-Fi name with its own long password, mapped to VLAN 30.",
      ],
      doneWhen: "Every device is on the new network or the devices-only network.",
      minutes: 30,
      when: { all: ["platform:other"] },
    },
    {
      id: "enroll-personal",
      title: "Agree the rules for personal devices",
      why: "Staff and volunteers keep control of their own phones. That matters most for people at higher risk.",
      actions: [
        "Install by hand only. Never enroll a personal device in MDM.",
        "Tell the owner what the certificate reveals: a device name and when it connected. Nothing else.",
        "Tell them how to remove it, and that you will revoke it when they leave.",
        "Enroll only with the owner's clear yes.",
      ],
      doneWhen: "Each personal device owner has agreed, and their device is on your list.",
      minutes: 15,
      when: { all: ["devices:personal"] },
    },
  ],
};
