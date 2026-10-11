/* ─── Wi-Fi Enterprise guide: shared types ──────────────────────────────
   Pure type declarations shared by the routing logic, progress logic,
   content data, and UI. No runtime code lives here.
   See docs/decisions/DECISION-007.md for the design rationale. */

/* ─── Intake ─────────────────────────────────────────────────────────── */

export type QuestionId =
  | "accessPoints"
  | "maintainer"
  | "radiusHost"
  | "mdm"
  | "platforms"
  | "personalDevices";

export interface QuestionOption {
  id: string;
  label: string;
  /** One short sentence shown under the label. Optional. */
  hint?: string;
}

export interface Question {
  id: QuestionId;
  prompt: string;
  /** Plain-language explanation of why we ask. */
  help: string;
  /** "single" renders radios; "multi" renders checkboxes. */
  kind: "single" | "multi";
  options: QuestionOption[];
}

/** Single-choice answers are a string; multi-choice answers are a string[]. */
export type Answers = Partial<Record<QuestionId, string | string[]>>;

/* ─── Routing result ─────────────────────────────────────────────────── */

export type PathId = "not-yet" | "manual" | "managed";

/**
 * Traits are flat tags derived from the answers. Content declares which
 * traits it needs, so adding a branch never means editing routing code.
 */
export type Trait =
  | "path:not-yet"
  | "path:manual"
  | "path:managed"
  | "ap:unifi"
  | "ap:other"
  | "ap:unknown"
  | "radius:onsite"
  | "radius:remote"
  | "radius:new-host"
  | "platform:apple"
  | "platform:windows"
  | "platform:android"
  | "platform:other"
  | "devices:personal";

export interface Profile {
  path: PathId;
  traits: ReadonlySet<Trait>;
  /** Human-readable reasons the path was chosen, in answer order. */
  reasons: string[];
}

/* ─── Content ────────────────────────────────────────────────────────── */

/** A step or stage is shown when every clause that is present holds. */
export interface Condition {
  all?: Trait[];
  any?: Trait[];
  none?: Trait[];
}

export interface CommandBlock {
  /** Short label above the block, e.g. "On the RADIUS host". */
  label: string;
  /** Rendered as text only; never executed or interpreted by the page. */
  code: string;
}

export interface Step {
  /** Stable, unique across the whole guide. Used as the progress key. */
  id: string;
  title: string;
  /** One sentence: why this step matters. */
  why: string;
  /** Direct, ordered instructions. */
  actions: string[];
  commands?: CommandBlock[];
  /** Observable completion criterion. */
  doneWhen: string;
  watchOut?: string;
  /** Rough active time in minutes. */
  minutes: number;
  /** External reference for this step: official documentation only. */
  reference?: { label: string; href: string };
  when?: Condition;
}

export interface Stage {
  id: string;
  title: string;
  summary: string;
  steps: Step[];
  when?: Condition;
}
