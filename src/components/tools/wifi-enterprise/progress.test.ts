import { describe, expect, it } from "vitest";
import { routeProfile } from "./paths";
import {
  STORAGE_KEY,
  completion,
  createStore,
  firstOpenStage,
  formatMinutes,
  parse,
  serialize,
  setAnswers,
  toMarkdown,
  toggleStep,
  type Progress,
  type StorageLike,
} from "./progress";
import type { Stage } from "./types";

const STAGES: Stage[] = [
  {
    id: "plan",
    title: "Plan",
    summary: "",
    steps: [
      { id: "plan-a", title: "Pick names", why: "", actions: [], doneWhen: "Names chosen", minutes: 20 },
      { id: "plan-b", title: "Draw VLANs", why: "", actions: [], doneWhen: "VLANs drawn", minutes: 40 },
    ],
  },
  {
    id: "build",
    title: "Build",
    summary: "",
    steps: [
      { id: "build-a", title: "Install", why: "", actions: [], doneWhen: "Running", minutes: 90 },
    ],
  },
];

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("progress state", () => {
  it("toggles steps on and off without duplicates", () => {
    let progress: Progress = { answers: {}, done: [] };
    progress = toggleStep(progress, "plan-b");
    progress = toggleStep(progress, "plan-a");
    expect(progress.done).toEqual(["plan-a", "plan-b"]);
    progress = toggleStep(progress, "plan-b");
    expect(progress.done).toEqual(["plan-a"]);
  });

  it("sanitizes answers on update", () => {
    const progress = setAnswers({ answers: {}, done: [] }, { mdm: "yes", bogus: "x" } as never);
    expect(progress.answers).toEqual({ mdm: "yes" });
  });

  it("counts only visible steps and remaining minutes", () => {
    const result = completion(STAGES, ["plan-a", "hidden-step"]);
    expect(result).toEqual({ done: 1, total: 3, percent: 33, minutesLeft: 130 });
    expect(completion([], [])).toEqual({ done: 0, total: 0, percent: 0, minutesLeft: 0 });
  });

  it("resumes at the first stage with unfinished work", () => {
    expect(firstOpenStage(STAGES, [])).toBe(0);
    expect(firstOpenStage(STAGES, ["plan-a", "plan-b"])).toBe(1);
    expect(firstOpenStage(STAGES, ["plan-a", "plan-b", "build-a"])).toBe(1);
    expect(firstOpenStage([], [])).toBe(0);
  });

  it("formats minutes for humans", () => {
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(120)).toBe("2 h");
    expect(formatMinutes(200)).toBe("3 h 20 min");
  });
});

describe("serialization", () => {
  it("round-trips valid progress", () => {
    const progress: Progress = { answers: { mdm: "no", platforms: ["apple"] }, done: ["plan-a"] };
    expect(parse(serialize(progress))).toEqual(progress);
  });

  it("rejects malformed, foreign, or wrong-version data without throwing", () => {
    expect(parse(null)).toBeNull();
    expect(parse("not json")).toBeNull();
    expect(parse("[]")).toBeNull();
    expect(parse(JSON.stringify({ v: 2, done: [] }))).toBeNull();
    expect(parse(JSON.stringify({ v: 1, done: "plan-a" }))).toBeNull();
  });

  it("strips step ids that are not plain slugs", () => {
    const parsed = parse(
      JSON.stringify({ v: 1, answers: {}, done: ["plan-a", "<img src=x>", "Plan-B", "plan-a"] }),
    );
    expect(parsed?.done).toEqual(["plan-a"]);
  });
});

describe("storage adapter", () => {
  it("saves, loads, and clears through the injected storage", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    expect(store.save({ answers: { mdm: "yes" }, done: ["plan-a"] })).toEqual({ ok: true });
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(store.load()).toEqual({ answers: { mdm: "yes" }, done: ["plan-a"] });
    expect(store.clear()).toEqual({ ok: true });
    expect(store.load()).toBeNull();
  });

  it("stores only option ids and step ids", () => {
    const storage = memoryStorage();
    createStore(storage).save({ answers: { mdm: "yes" }, done: ["plan-a"] });
    const raw = storage.data.get(STORAGE_KEY) ?? "";
    expect(JSON.parse(raw)).toEqual({ v: 1, answers: { mdm: "yes" }, done: ["plan-a"] });
  });

  it("reports blocked storage instead of throwing", () => {
    const store = createStore(throwing);
    expect(store.load()).toBeNull();
    const saved = store.save({ answers: {}, done: [] });
    expect(saved.ok).toBe(false);
    expect(store.clear().ok).toBe(false);
    expect(createStore(null).save({ answers: {}, done: [] }).ok).toBe(false);
  });
});

describe("markdown export", () => {
  const profile = routeProfile({
    accessPoints: "unifi",
    maintainer: "yes",
    radiusHost: "onsite",
    mdm: "no",
    platforms: ["apple"],
    personalDevices: "no",
  });

  it("produces a dated Obsidian checklist with checked and open items", () => {
    if (!profile) throw new Error("expected a profile");
    const markdown = toMarkdown({
      profile,
      stages: STAGES,
      done: ["plan-a"],
      isoDate: "2026-10-11",
      guideVersion: "0.1.0",
    });
    expect(markdown.startsWith("---\n")).toBe(true);
    expect(markdown).toContain("exported: 2026-10-11");
    expect(markdown).toContain("guide_version: 0.1.0");
    expect(markdown).toContain("progress: 1/3");
    expect(markdown).toContain("- [x] Pick names (~20 min)");
    expect(markdown).toContain("- [ ] Draw VLANs (~40 min)");
    expect(markdown).toContain("  - Done when: VLANs drawn");
    expect(markdown).toContain("## Build");
  });

  it("escapes characters that would alter Markdown structure", () => {
    if (!profile) throw new Error("expected a profile");
    const markdown = toMarkdown({
      profile,
      stages: [
        {
          id: "x",
          title: "Edit *config*",
          summary: "",
          steps: [{ id: "x-1", title: "Run `cmd`\n# heading", why: "", actions: [], doneWhen: "[ok]", minutes: 1 }],
        },
      ],
      done: [],
      isoDate: "2026-10-11",
      guideVersion: "0.1.0",
    });
    expect(markdown).toContain("## Edit \\*config\\*");
    expect(markdown).toContain("- [ ] Run \\`cmd\\` # heading (~1 min)");
    expect(markdown).toContain("Done when: \\[ok\\]");
  });
});
