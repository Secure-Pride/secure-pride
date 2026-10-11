/* ─── Wi-Fi Enterprise guide: intake questions and path routing ─────────
   Pure functions only. Answers in → Profile (path + traits) out.
   No storage, no network, no DOM. */

import type {
  Answers,
  Condition,
  PathId,
  Profile,
  Question,
  QuestionId,
  Stage,
  Step,
  Trait,
} from "./types";

/* ─── Questions ──────────────────────────────────────────────────────── */

export const QUESTIONS: readonly Question[] = [
  {
    id: "accessPoints",
    kind: "single",
    prompt: "What Wi-Fi equipment does your space use?",
    help: "Enterprise Wi-Fi needs access points that support WPA2-Enterprise or WPA3-Enterprise. Most home and ISP routers do not.",
    options: [
      { id: "unifi", label: "Ubiquiti UniFi access points" },
      {
        id: "other-managed",
        label: "Another business brand",
        hint: "For example TP-Link Omada, Aruba Instant On, Meraki, Ruckus.",
      },
      {
        id: "consumer",
        label: "A home or internet-provider router",
        hint: "The box your internet company gave you, or a store-bought router.",
      },
      { id: "unknown", label: "I'm not sure" },
    ],
  },
  {
    id: "maintainer",
    kind: "single",
    prompt: "Can someone spend about one hour a month looking after it?",
    help: "Certificates expire, people leave, and software needs updates. This person should be comfortable typing commands into a terminal.",
    options: [
      { id: "yes", label: "Yes, we have that person" },
      { id: "no", label: "No, not right now" },
    ],
  },
  {
    id: "radiusHost",
    kind: "single",
    prompt: "Where could the login server run?",
    help: "The login server (RADIUS) checks each device. It must stay on all the time.",
    options: [
      {
        id: "onsite",
        label: "On a computer that stays on at our space",
        hint: "A small Linux box, mini PC, or spare server on the same network.",
      },
      {
        id: "remote",
        label: "On a cloud server we already run",
        hint: "A virtual private server (VPS) somewhere else.",
      },
      { id: "none", label: "We don't have either yet" },
    ],
  },
  {
    id: "mdm",
    kind: "single",
    prompt: "Do you manage organization devices with an MDM tool?",
    help: "MDM (mobile device management) installs settings onto devices for you. Examples: Jamf, Mosyle, Kandji, Intune. It is optional.",
    options: [
      { id: "yes", label: "Yes, we use MDM" },
      { id: "no", label: "No, or I'm not sure" },
    ],
  },
  {
    id: "platforms",
    kind: "multi",
    prompt: "Which kinds of devices will join? Choose all that apply.",
    help: "Each system installs certificates a little differently. We only show the steps you need.",
    options: [
      { id: "apple", label: "Mac, iPhone, or iPad" },
      { id: "windows", label: "Windows" },
      { id: "android", label: "Android" },
      {
        id: "other",
        label: "Something else",
        hint: "Linux, ChromeOS, printers, or smart devices.",
      },
    ],
  },
  {
    id: "personalDevices",
    kind: "single",
    prompt: "Will personal phones or laptops join this network?",
    help: "Devices owned by staff or volunteers need a lighter touch. We will not ask anyone to put MDM on a personal device.",
    options: [
      { id: "yes", label: "Yes, some personal devices" },
      { id: "no", label: "No, organization devices only" },
    ],
  },
];

const QUESTION_IDS = QUESTIONS.map((question) => question.id);

/* ─── Answer validation ──────────────────────────────────────────────── */

/** Returns the question, or undefined for an unknown id. */
export function findQuestion(id: string): Question | undefined {
  return QUESTIONS.find((question) => question.id === id);
}

/**
 * Drops anything that is not a known question with a known option.
 * Used on every answer that comes from storage or the UI.
 */
export function sanitizeAnswers(input: unknown): Answers {
  if (typeof input !== "object" || input === null) return {};
  const clean: Answers = {};
  for (const question of QUESTIONS) {
    const raw = (input as Record<string, unknown>)[question.id];
    const allowed = new Set(question.options.map((option) => option.id));
    if (question.kind === "single") {
      if (typeof raw === "string" && allowed.has(raw)) clean[question.id] = raw;
      continue;
    }
    if (!Array.isArray(raw)) continue;
    const picked = question.options
      .map((option) => option.id)
      .filter((id) => raw.includes(id) && allowed.has(id));
    if (picked.length > 0) clean[question.id] = picked;
  }
  return clean;
}

/** True when every question has a valid answer. */
export function isComplete(answers: Answers): boolean {
  const clean = sanitizeAnswers(answers);
  return QUESTION_IDS.every((id) => clean[id] !== undefined);
}

/** Ids of questions still unanswered, in display order. */
export function unansweredQuestions(answers: Answers): QuestionId[] {
  const clean = sanitizeAnswers(answers);
  return QUESTION_IDS.filter((id) => clean[id] === undefined);
}

/* ─── Routing ────────────────────────────────────────────────────────── */

function single(answers: Answers, id: QuestionId): string {
  const value = answers[id];
  return typeof value === "string" ? value : "";
}

function multi(answers: Answers, id: QuestionId): string[] {
  const value = answers[id];
  return Array.isArray(value) ? value : [];
}

function choosePath(answers: Answers, reasons: string[]): PathId {
  const accessPoints = single(answers, "accessPoints");
  const maintainer = single(answers, "maintainer");

  if (accessPoints === "consumer") {
    reasons.push(
      "Home and internet-provider routers rarely support WPA-Enterprise.",
    );
  }
  if (maintainer === "no") {
    reasons.push(
      "Without someone to renew and revoke certificates, enterprise Wi-Fi breaks or quietly weakens.",
    );
  }
  if (accessPoints === "consumer" || maintainer === "no") return "not-yet";

  if (single(answers, "mdm") === "yes") {
    reasons.push("Your MDM can install Wi-Fi settings and certificates for you.");
    return "managed";
  }
  reasons.push(
    "Without MDM, you will install a certificate on each device by hand. That works well for small teams.",
  );
  return "manual";
}

function radiusTrait(answers: Answers, reasons: string[]): Trait {
  const host = single(answers, "radiusHost");
  if (host === "onsite") return "radius:onsite";
  if (host === "remote") {
    reasons.push(
      "Your login server is off-site, so we add an encrypted tunnel step. Login traffic should never cross the internet unprotected.",
    );
    return "radius:remote";
  }
  reasons.push(
    "You need a small always-on computer for the login server. We include how to choose one.",
  );
  return "radius:new-host";
}

function accessPointTrait(answers: Answers, reasons: string[]): Trait | null {
  const accessPoints = single(answers, "accessPoints");
  if (accessPoints === "unifi") return "ap:unifi";
  if (accessPoints === "other-managed") return "ap:other";
  if (accessPoints === "unknown") {
    reasons.push(
      "You're not sure about your access points, so checking them is your first step.",
    );
    return "ap:unknown";
  }
  return null;
}

/**
 * Turns complete answers into a Profile. Returns null when any answer is
 * missing or invalid — the UI must not show a path for partial answers.
 */
export function routeProfile(input: Answers): Profile | null {
  const answers = sanitizeAnswers(input);
  if (!isComplete(answers)) return null;

  const reasons: string[] = [];
  const path = choosePath(answers, reasons);
  const traits = new Set<Trait>([`path:${path}`]);

  const accessPoint = accessPointTrait(answers, reasons);
  if (accessPoint) traits.add(accessPoint);

  // The not-yet path never builds a login server, so its reasons stay
  // focused on why, not on infrastructure the reader won't deploy.
  if (path !== "not-yet") traits.add(radiusTrait(answers, reasons));

  for (const platform of multi(answers, "platforms")) {
    traits.add(`platform:${platform}` as Trait);
  }
  if (single(answers, "personalDevices") === "yes") {
    traits.add("devices:personal");
    if (path === "managed") {
      reasons.push(
        "Personal devices get a manual install, not MDM. MDM on a personal device can expose personal data.",
      );
    }
  }

  return { path, traits, reasons };
}

/* ─── Content filtering ──────────────────────────────────────────────── */

/** Pure predicate: does this condition hold for these traits? */
export function matches(
  condition: Condition | undefined,
  traits: ReadonlySet<Trait>,
): boolean {
  if (!condition) return true;
  if (condition.all && !condition.all.every((trait) => traits.has(trait))) {
    return false;
  }
  if (condition.any && !condition.any.some((trait) => traits.has(trait))) {
    return false;
  }
  if (condition.none && condition.none.some((trait) => traits.has(trait))) {
    return false;
  }
  return true;
}

/** Stages that apply to this profile, each holding only its applicable steps. */
export function visibleStages(
  stages: readonly Stage[],
  profile: Profile,
): Stage[] {
  return stages
    .filter((stage) => matches(stage.when, profile.traits))
    .map((stage) => ({
      ...stage,
      steps: stage.steps.filter((step: Step) =>
        matches(step.when, profile.traits),
      ),
    }))
    .filter((stage) => stage.steps.length > 0);
}

export const PATH_LABELS: Record<PathId, { title: string; summary: string }> = {
  "not-yet": {
    title: "Harden what you have first",
    summary:
      "Enterprise Wi-Fi isn't the right fit yet. These steps make your current network much safer, and show what would change the answer.",
  },
  manual: {
    title: "Enterprise Wi-Fi, installed by hand",
    summary:
      "Each device gets its own certificate, installed one at a time. Good for teams up to roughly 25 devices.",
  },
  managed: {
    title: "Enterprise Wi-Fi, delivered by MDM",
    summary:
      "Your MDM installs certificates and Wi-Fi settings. People connect without typing a password.",
  },
};
