/* ─── Wi-Fi Enterprise guide: version and shared example values ─────────
   Bump GUIDE_VERSION (semver) whenever guide content changes:
   patch = wording, minor = steps added/removed, major = path changes.
   1.0.0 waits for Secure Pride's own rollout on real access points. */

export const GUIDE_VERSION = "0.1.0";
export const GUIDE_UPDATED = "2026-10-11";

/** Example values used in every command. Readers replace them once. */
export const PLACEHOLDERS: ReadonlyArray<{ example: string; meaning: string }> = [
  {
    example: "ca.example.internal",
    meaning: "Name for your certificate authority. Any name you control.",
  },
  {
    example: "radius.example.internal",
    meaning: "Name for your login server. Devices check this name.",
  },
  {
    example: "192.168.1.0/24",
    meaning: "The network your access points are on.",
  },
  {
    example: "10 · 20 · 30",
    meaning: "VLAN numbers for staff, volunteers, and devices.",
  },
  {
    example: "staff-laptop-07",
    meaning: "A device name. A role, a type, and a number — never a person.",
  },
];
