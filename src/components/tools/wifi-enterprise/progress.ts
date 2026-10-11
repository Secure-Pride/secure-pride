/* ─── Wi-Fi Enterprise guide: progress state, storage, export ───────────
   Pure functions plus one storage adapter. The adapter takes an injected
   Storage-like object so it can be tested without a browser, and so the
   UI decides — explicitly, opt-in — whether any storage is used at all.

   What is ever stored (DECISION-007): intake option ids and completed step
   ids. Never free text, names, hostnames, secrets, or keys. */

import { PATH_LABELS, sanitizeAnswers } from "./paths";
import type { Answers, Profile, Stage } from "./types";

/* ─── State ──────────────────────────────────────────────────────────── */

export const STORAGE_KEY = "sp.wifi-enterprise.progress";
const SCHEMA_VERSION = 1;

export interface Progress {
  answers: Answers;
  /** Completed step ids. Kept sorted and unique. */
  done: string[];
}

export const EMPTY_PROGRESS: Progress = { answers: {}, done: [] };

/** Returns a new Progress with the step toggled. */
export function toggleStep(progress: Progress, stepId: string): Progress {
  const done = new Set(progress.done);
  if (done.has(stepId)) done.delete(stepId);
  else done.add(stepId);
  return { ...progress, done: [...done].sort() };
}

/**
 * Changing answers can change which steps exist. Completed ids for steps
 * that are no longer visible are kept (so switching back restores them)
 * but never counted — completion() only counts visible steps.
 */
export function setAnswers(progress: Progress, answers: Answers): Progress {
  return { ...progress, answers: sanitizeAnswers(answers) };
}

export interface Completion {
  done: number;
  total: number;
  /** Integer 0–100. */
  percent: number;
  minutesLeft: number;
}

/** Completion across the given (already filtered) stages. */
export function completion(
  stages: readonly Stage[],
  done: readonly string[],
): Completion {
  const finished = new Set(done);
  const steps = stages.flatMap((stage) => stage.steps);
  const total = steps.length;
  const doneCount = steps.filter((step) => finished.has(step.id)).length;
  const minutesLeft = steps
    .filter((step) => !finished.has(step.id))
    .reduce((sum, step) => sum + step.minutes, 0);
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  return { done: doneCount, total, percent, minutesLeft };
}

/** Index of the first stage with an unfinished step, or the last stage. */
export function firstOpenStage(
  stages: readonly Stage[],
  done: readonly string[],
): number {
  const finished = new Set(done);
  const index = stages.findIndex((stage) =>
    stage.steps.some((step) => !finished.has(step.id)),
  );
  return index === -1 ? Math.max(stages.length - 1, 0) : index;
}

/** "about 3 h 20 min" style label for a minute count. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/* ─── Serialization ──────────────────────────────────────────────────── */

const STEP_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function serialize(progress: Progress): string {
  return JSON.stringify({
    v: SCHEMA_VERSION,
    answers: sanitizeAnswers(progress.answers),
    done: progress.done.filter((id) => STEP_ID.test(id)),
  });
}

/**
 * Parses stored progress. Anything malformed, from another schema
 * version, or carrying unexpected values yields null — never a throw.
 */
export function parse(raw: string | null): Progress | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const record = data as Record<string, unknown>;
  if (record.v !== SCHEMA_VERSION || !Array.isArray(record.done)) return null;
  const done = record.done
    .filter((id): id is string => typeof id === "string" && STEP_ID.test(id))
    .slice(0, 500);
  return {
    answers: sanitizeAnswers(record.answers),
    done: [...new Set(done)].sort(),
  };
}

/* ─── Storage adapter ────────────────────────────────────────────────── */

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type StoreResult = { ok: true } | { ok: false; reason: string };

const UNAVAILABLE =
  "This browser blocked saving. Your progress still works until you close the tab. Use “Download checklist” to keep a copy.";

/**
 * Side effects: reads/writes the injected storage only. Every call is
 * wrapped because storage throws in private windows, when blocked, or
 * when full.
 */
export function createStore(storage: StorageLike | null) {
  return {
    load(): Progress | null {
      if (!storage) return null;
      try {
        return parse(storage.getItem(STORAGE_KEY));
      } catch {
        return null;
      }
    },
    save(progress: Progress): StoreResult {
      if (!storage) return { ok: false, reason: UNAVAILABLE };
      try {
        storage.setItem(STORAGE_KEY, serialize(progress));
        return { ok: true };
      } catch {
        return { ok: false, reason: UNAVAILABLE };
      }
    },
    clear(): StoreResult {
      if (!storage) return { ok: true };
      try {
        storage.removeItem(STORAGE_KEY);
        return { ok: true };
      } catch {
        return { ok: false, reason: UNAVAILABLE };
      }
    },
  };
}

/** Resolves window.localStorage without throwing (it can throw on access). */
export function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/* ─── Markdown export ────────────────────────────────────────────────── */

/** Neutralizes characters that would change Markdown/YAML structure. */
function inline(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/([\\`*_[\]<>|])/g, "\\$1");
}

/**
 * Builds an Obsidian-friendly checklist: YAML frontmatter, one heading per
 * stage, `- [x]` tasks with their completion criteria. Pure: the caller
 * supplies the date so output is deterministic and testable.
 */
export function toMarkdown(args: {
  profile: Profile;
  stages: readonly Stage[];
  done: readonly string[];
  isoDate: string;
  guideVersion: string;
}): string {
  const { profile, stages, done, isoDate, guideVersion } = args;
  const finished = new Set(done);
  const summary = completion(stages, done);
  const label = PATH_LABELS[profile.path];

  const lines: string[] = [
    "---",
    `title: "Wi-Fi Enterprise checklist"`,
    `guide: securepride.org/tools/wifi-enterprise`,
    `guide_version: ${guideVersion}`,
    `exported: ${isoDate}`,
    `path: ${profile.path}`,
    `progress: ${summary.done}/${summary.total}`,
    "tags: [secure-pride, wifi, 802-1x, checklist]",
    "---",
    "",
    `# ${inline(label.title)}`,
    "",
    inline(label.summary),
    "",
    "## Why this path",
    "",
    ...profile.reasons.map((reason) => `- ${inline(reason)}`),
    "",
  ];

  for (const stage of stages) {
    lines.push(`## ${inline(stage.title)}`, "");
    for (const step of stage.steps) {
      const box = finished.has(step.id) ? "x" : " ";
      lines.push(`- [${box}] ${inline(step.title)} (~${step.minutes} min)`);
      lines.push(`  - Done when: ${inline(step.doneWhen)}`);
    }
    lines.push("");
  }

  lines.push(
    "> Exported from the Secure Pride Wi-Fi Enterprise guide. This file holds no secrets. Keep shared secrets, keys, and the device-to-person list in your password manager, not here.",
    "",
  );
  return lines.join("\n");
}
