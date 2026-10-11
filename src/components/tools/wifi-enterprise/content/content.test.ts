import { describe, expect, it } from "vitest";
import { QUESTIONS, routeProfile, visibleStages } from "../paths";
import { completion, parse, serialize } from "../progress";
import type { Answers, Profile, Stage } from "../types";
import clientsConf from "../files/clients.conf?raw";
import eapConf from "../files/eap.conf?raw";
import crlScript from "../files/refresh-wifi-crl.sh?raw";
import deviceTemplate from "../files/wifi-device.tpl?raw";
import { GUIDE_VERSION, STAGES } from "./index";

/* ─── Helpers ────────────────────────────────────────────────────────── */

const allSteps = STAGES.flatMap((stage) => stage.steps);

function subsets<T>(items: T[]): T[][] {
  return items
    .reduce<T[][]>((acc, item) => acc.concat(acc.map((set) => [...set, item])), [[]])
    .filter((set) => set.length > 0);
}

/** Every complete answer combination the intake can produce. */
function everyAnswerSet(): Answers[] {
  let sets: Answers[] = [{}];
  for (const question of QUESTIONS) {
    const ids = question.options.map((option) => option.id);
    const values: Array<string | string[]> =
      question.kind === "single" ? ids : subsets(ids);
    sets = sets.flatMap((answers) =>
      values.map((value) => ({ ...answers, [question.id]: value })),
    );
  }
  return sets;
}

function route(answers: Answers): { profile: Profile; stages: Stage[] } {
  const profile = routeProfile(answers);
  if (!profile) throw new Error(`no profile for ${JSON.stringify(answers)}`);
  return { profile, stages: visibleStages(STAGES, profile) };
}

const BUILD: Answers = {
  accessPoints: "unifi",
  maintainer: "yes",
  radiusHost: "onsite",
  mdm: "no",
  platforms: ["apple"],
  personalDevices: "no",
};

/* ─── Structure ──────────────────────────────────────────────────────── */

describe("guide content structure", () => {
  it("uses semver", () => expect(GUIDE_VERSION).toMatch(/^\d+\.\d+\.\d+$/));

  it("has unique stage and step ids", () => {
    const stageIds = STAGES.map((stage) => stage.id);
    const stepIds = allSteps.map((step) => step.id);
    expect(new Set(stageIds).size).toBe(stageIds.length);
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it("uses step ids that survive the storage sanitizer", () => {
    const ids = allSteps.map((step) => step.id);
    expect(parse(serialize({ answers: {}, done: ids }))?.done).toEqual([...ids].sort());
  });

  it("gives every step a reason, actions, a completion test, and time", () => {
    for (const step of allSteps) {
      expect(step.title, step.id).not.toBe("");
      expect(step.why, step.id).not.toBe("");
      expect(step.actions.length, step.id).toBeGreaterThan(0);
      expect(step.doneWhen, step.id).not.toBe("");
      expect(step.minutes, step.id).toBeGreaterThan(0);
    }
  });

  it("links only to official HTTPS documentation", () => {
    const allowed = [
      "smallstep.com",
      "github.com",
      "freeradius.org",
      "www.wireguard.com",
      "help.ui.com",
      "support.apple.com",
    ];
    for (const step of allSteps.filter((s) => s.reference)) {
      const url = new URL(step.reference?.href ?? "");
      expect(url.protocol, step.id).toBe("https:");
      expect(allowed, step.id).toContain(url.hostname);
    }
  });
});

/* ─── Routing coverage ───────────────────────────────────────────────── */

describe("every intake combination yields a coherent path", () => {
  const sets = everyAnswerSet();

  it("covers the full answer space", () => expect(sets.length).toBe(4 * 2 * 3 * 2 * 15 * 2));

  it("never yields an empty guide", () => {
    for (const answers of sets) expect(route(answers).stages.length).toBeGreaterThan(0);
  });

  it("keeps the not-yet path to hardening only", () => {
    for (const answers of sets) {
      const { profile, stages } = route(answers);
      if (profile.path !== "not-yet") continue;
      expect(stages.map((stage) => stage.id)).toEqual(["harden"]);
    }
  });

  it("includes the full build sequence on every enterprise path", () => {
    const required = ["plan", "ca", "radius", "access-points", "enroll", "verify", "cutover", "maintain"];
    for (const answers of sets) {
      const { profile, stages } = route(answers);
      if (profile.path === "not-yet") continue;
      const ids = stages.map((stage) => stage.id);
      for (const id of required) expect(ids, JSON.stringify(answers)).toContain(id);
      expect(ids.includes("tunnel")).toBe(profile.traits.has("radius:remote"));
    }
  });

  it("shows enrollment steps for each chosen platform", () => {
    const stepFor: Record<string, string[]> = {
      apple: ["enroll-apple-manual", "enroll-apple-mdm"],
      windows: ["enroll-windows"],
      android: ["enroll-android"],
      other: ["enroll-other"],
    };
    for (const answers of sets) {
      const { profile, stages } = route(answers);
      if (profile.path === "not-yet") continue;
      const ids = stages.flatMap((stage) => stage.steps.map((step) => step.id));
      for (const platform of answers.platforms as string[]) {
        expect(ids.some((id) => stepFor[platform].includes(id)), platform).toBe(true);
      }
    }
  });

  it("never routes personal Apple devices only through MDM", () => {
    const { stages } = route({ ...BUILD, mdm: "yes", personalDevices: "yes" });
    const ids = stages.flatMap((stage) => stage.steps.map((step) => step.id));
    expect(ids).toContain("enroll-apple-manual");
    expect(ids).toContain("enroll-personal");
    const orgOnly = route({ ...BUILD, mdm: "yes" }).stages.flatMap((s) => s.steps.map((x) => x.id));
    expect(orgOnly).not.toContain("enroll-apple-manual");
  });

  it("keeps the manual build within the planned effort", () => {
    const hours = completion(route(BUILD).stages, []).minutesLeft / 60;
    expect(hours).toBeGreaterThanOrEqual(8);
    expect(hours).toBeLessThanOrEqual(14);
  });
});

/* ─── Published files: the lab-verified bytes ────────────────────────── */

describe("published configuration files", () => {
  const shown = allSteps.flatMap((step) => step.commands ?? []).map((block) => block.code);

  it("shows each lab-verified file verbatim", () => {
    for (const file of [eapConf, clientsConf, crlScript, deviceTemplate]) {
      expect(shown).toContain(file.trimEnd());
    }
  });

  it("contains no real or default secrets", () => {
    expect(clientsConf).not.toMatch(/testing123/);
    for (const line of clientsConf.split("\n").filter((l) => /^\s*secret\s*=/.test(l))) {
      expect(line).toMatch(/REPLACE_WITH_SECRET_\d/);
    }
  });

  it("trusts only the organization's CA and enforces revocation", () => {
    expect(eapConf).not.toMatch(/ca-certificates\.crt/);
    expect(eapConf).toMatch(/check_crl = yes/);
    expect(eapConf).toMatch(/ca_path_reload_interval = 3600/);
    expect(clientsConf).toMatch(/require_message_authenticator = yes/);
  });

  it("matches the template's CRL URL to the configured idpURL", () => {
    const templateUrl = deviceTemplate.match(/"crlDistributionPoints": \["([^"]+)"\]/)?.[1];
    const idp = shown.join("\n").match(/"idpURL": \\?"([^"\\]+)/)?.[1];
    expect(templateUrl).toBeDefined();
    expect(idp).toBe(templateUrl);
  });
});

/* ─── Claims discipline (DECISION-007, corrections 1–5) ──────────────── */

describe("guide wording avoids corrected over-claims", () => {
  const text = JSON.stringify(STAGES).toLowerCase();
  it.each(["eliminat", "guarantee", "gdpr", "ccpa", "compliant", "fully secure", "free for nonprofits"])(
    "never says “%s”",
    (phrase) => expect(text).not.toContain(phrase),
  );
});
