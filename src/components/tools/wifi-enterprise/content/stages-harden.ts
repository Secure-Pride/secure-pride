/* ─── "Not yet" path: harden the current network ────────────────────────
   Shown when the access points can't do WPA-Enterprise or nobody can
   maintain it. Every step here works on a home or ISP router. */

import type { Stage } from "../types";

export const HARDEN_STAGE: Stage = {
  id: "harden",
  title: "Make your current Wi-Fi much safer",
  summary:
    "Five changes that work on almost any router. Together they take about two hours.",
  when: { all: ["path:not-yet"] },
  steps: [
    {
      id: "harden-encryption",
      title: "Use the strongest Wi-Fi security your router offers",
      why: "Older settings can be cracked in minutes.",
      actions: [
        "Sign in to your router's admin page. The address is usually on its label.",
        "Choose WPA3-Personal. If some devices can't join, choose WPA2/WPA3 mixed.",
        "If neither exists, choose WPA2-Personal with AES. Never WEP, WPA, or TKIP.",
        "Turn off WPS (the push-button or PIN pairing).",
      ],
      doneWhen: "Security shows WPA3 or WPA2/WPA3, and WPS is off.",
      minutes: 20,
    },
    {
      id: "harden-passphrase",
      title: "Set a long, random Wi-Fi password",
      why: "Short or guessable passwords can be cracked offline after one connection is captured.",
      actions: [
        "Generate a password of at least 20 random characters in your password manager.",
        "Set it on the router, then reconnect your devices.",
        "Keep a list of roles that know it. Change it when anyone on that list leaves.",
      ],
      doneWhen: "The new password works, and the list of who knows it exists.",
      minutes: 30,
    },
    {
      id: "harden-guest",
      title: "Put visitors and smart devices on a guest network",
      why: "A visitor's phone or a cheap smart plug shouldn't see your laptops.",
      actions: [
        "Turn on the guest network with its own password.",
        "Turn on guest or client isolation if offered.",
        "Move printers, TVs, and smart devices there unless staff must reach them.",
      ],
      doneWhen: "Visitors and smart devices use the guest network.",
      minutes: 20,
    },
    {
      id: "harden-admin",
      title: "Lock down the router itself",
      why: "Whoever controls the router controls the network.",
      actions: [
        "Change the router's admin password to a new random one. Save it.",
        "Turn off remote administration.",
        "Turn off UPnP unless something specific needs it.",
        "Turn on automatic firmware updates, or check for updates now.",
      ],
      doneWhen: "The admin password is new and saved, and the firmware is current.",
      minutes: 30,
    },
    {
      id: "harden-revisit",
      title: "Know what would change the answer",
      why: "Enterprise Wi-Fi becomes worth it once two things are true.",
      actions: [
        "You have business access points that support WPA2/WPA3-Enterprise.",
        "Someone can spend about one hour a month maintaining it.",
        "When both are true, answer the questions again.",
      ],
      doneWhen: "You've noted these conditions somewhere your team will see them.",
      minutes: 5,
    },
  ],
};
