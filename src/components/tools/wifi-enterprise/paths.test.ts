import { describe, expect, it } from "vitest";
import {
  isComplete,
  matches,
  routeProfile,
  sanitizeAnswers,
  unansweredQuestions,
  visibleStages,
} from "./paths";
import type { Answers, Stage, Trait } from "./types";

const BASE: Answers = {
  accessPoints: "unifi",
  maintainer: "yes",
  radiusHost: "onsite",
  mdm: "no",
  platforms: ["apple"],
  personalDevices: "no",
};

describe("answer validation", () => {
  it("drops unknown questions, unknown options, and wrong shapes", () => {
    const clean = sanitizeAnswers({
      accessPoints: "unifi",
      maintainer: "maybe",
      platforms: ["apple", "toaster", 7],
      mdm: ["yes"],
      injected: "<script>",
    });
    expect(clean).toEqual({ accessPoints: "unifi", platforms: ["apple"] });
  });

  it("treats non-objects as empty", () => {
    expect(sanitizeAnswers(null)).toEqual({});
    expect(sanitizeAnswers("x")).toEqual({});
  });

  it("requires every question before routing", () => {
    const partial = { ...BASE, platforms: [] };
    expect(isComplete(partial)).toBe(false);
    expect(unansweredQuestions(partial)).toEqual(["platforms"]);
    expect(routeProfile(partial)).toBeNull();
    expect(routeProfile(BASE)).not.toBeNull();
  });
});

describe("path routing", () => {
  it("routes consumer routers to the not-yet path", () => {
    const profile = routeProfile({ ...BASE, accessPoints: "consumer" });
    expect(profile?.path).toBe("not-yet");
    expect(profile?.traits.has("radius:onsite")).toBe(false);
  });

  it("routes a missing maintainer to not-yet even with good hardware", () => {
    expect(routeProfile({ ...BASE, maintainer: "no" })?.path).toBe("not-yet");
  });

  it("chooses managed with MDM and manual without", () => {
    expect(routeProfile({ ...BASE, mdm: "yes" })?.path).toBe("managed");
    expect(routeProfile(BASE)?.path).toBe("manual");
  });

  it("adds the tunnel trait for an off-site login server", () => {
    const profile = routeProfile({ ...BASE, radiusHost: "remote" });
    expect(profile?.traits.has("radius:remote")).toBe(true);
    expect(profile?.reasons.join(" ")).toMatch(/tunnel/);
  });

  it("maps every chosen platform and personal devices to traits", () => {
    const profile = routeProfile({
      ...BASE,
      platforms: ["apple", "android", "windows"],
      personalDevices: "yes",
    });
    const expected: Trait[] = [
      "platform:apple",
      "platform:android",
      "platform:windows",
      "devices:personal",
    ];
    for (const trait of expected) expect(profile?.traits.has(trait)).toBe(true);
  });

  it("explains that personal devices skip MDM on the managed path", () => {
    const profile = routeProfile({ ...BASE, mdm: "yes", personalDevices: "yes" });
    expect(profile?.reasons.join(" ")).toMatch(/not MDM/);
  });

  it("flags unknown access points so checking them comes first", () => {
    const profile = routeProfile({ ...BASE, accessPoints: "unknown" });
    expect(profile?.path).toBe("manual");
    expect(profile?.traits.has("ap:unknown")).toBe(true);
  });
});

describe("condition matching", () => {
  const traits = new Set<Trait>(["path:manual", "platform:apple"]);
  it("passes with no condition", () => expect(matches(undefined, traits)).toBe(true));
  it("checks all, any, and none clauses together", () => {
    expect(matches({ all: ["path:manual", "platform:apple"] }, traits)).toBe(true);
    expect(matches({ all: ["path:manual", "platform:windows"] }, traits)).toBe(false);
    expect(matches({ any: ["platform:windows", "platform:apple"] }, traits)).toBe(true);
    expect(matches({ none: ["path:not-yet"] }, traits)).toBe(true);
    expect(matches({ any: ["platform:apple"], none: ["path:manual"] }, traits)).toBe(false);
  });
});

describe("stage filtering", () => {
  const stages: Stage[] = [
    {
      id: "a",
      title: "A",
      summary: "",
      steps: [
        { id: "a-1", title: "", why: "", actions: [], doneWhen: "", minutes: 5 },
        {
          id: "a-2",
          title: "",
          why: "",
          actions: [],
          doneWhen: "",
          minutes: 5,
          when: { all: ["platform:windows"] },
        },
      ],
    },
    {
      id: "b",
      title: "B",
      summary: "",
      when: { all: ["path:not-yet"] },
      steps: [{ id: "b-1", title: "", why: "", actions: [], doneWhen: "", minutes: 5 }],
    },
    {
      id: "c",
      title: "C",
      summary: "",
      steps: [
        {
          id: "c-1",
          title: "",
          why: "",
          actions: [],
          doneWhen: "",
          minutes: 5,
          when: { all: ["platform:android"] },
        },
      ],
    },
  ];

  it("removes non-matching steps and stages left empty", () => {
    const profile = routeProfile(BASE);
    if (!profile) throw new Error("expected a profile");
    const visible = visibleStages(stages, profile);
    expect(visible.map((stage) => stage.id)).toEqual(["a"]);
    expect(visible[0].steps.map((step) => step.id)).toEqual(["a-1"]);
  });

  it("does not mutate the source stages", () => {
    const profile = routeProfile(BASE);
    if (!profile) throw new Error("expected a profile");
    visibleStages(stages, profile);
    expect(stages[0].steps).toHaveLength(2);
  });
});
