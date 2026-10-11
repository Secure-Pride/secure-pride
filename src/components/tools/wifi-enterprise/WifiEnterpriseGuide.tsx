/* ─── WifiEnterpriseGuide: page shell and state ─────────────────────────
   Owns all state; children only render and report events.
   Side effects (all local to this browser, documented in DECISION-007):
     • localStorage — only after the reader opts in; holds option ids and
       step ids. Read on mount, which finds data only after an earlier opt-in.
     • A Blob download for the Markdown checklist.
   No network requests. */

import { useEffect, useMemo, useRef, useState } from "react";
import { GUIDE_UPDATED, GUIDE_VERSION, STAGES } from "./content";
import { routeProfile, visibleStages } from "./paths";
import {
  EMPTY_PROGRESS,
  browserStorage,
  completion,
  createStore,
  firstOpenStage,
  formatMinutes,
  setAnswers,
  toMarkdown,
  toggleStep,
  type Progress,
} from "./progress";
import type { Answers } from "./types";
import IntakeForm from "./ui/IntakeForm";
import PathSummary from "./ui/PathSummary";
import ProgressPanel from "./ui/ProgressPanel";
import { StageNav, StageView } from "./ui/StageView";

const LAB_RECORD =
  "https://github.com/mazze93/secure-pride/blob/main/docs/guides/wifi-enterprise-lab-verification.md";

type View = "intake" | "guide";

/* ─── Side-effect helper: Markdown download ──────────────────────────── */
function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function WifiEnterpriseGuide() {
  const store = useMemo(() => createStore(browserStorage()), []);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [persist, setPersist] = useState(false);
  const [view, setView] = useState<View>("intake");
  const [active, setActive] = useState(0);
  const [storeNotice, setStoreNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const pathHeading = useRef<HTMLHeadingElement>(null);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<"path" | "stage" | null>(null);

  const profile = useMemo(() => routeProfile(progress.answers), [progress.answers]);
  const stages = useMemo(() => (profile ? visibleStages(STAGES, profile) : []), [profile]);
  const doneSet = useMemo(() => new Set(progress.done), [progress.done]);
  const summary = completion(stages, progress.done);
  const totalLabel = `about ${formatMinutes(completion(stages, []).minutesLeft)} total`;
  const activeIndex = Math.min(active, Math.max(stages.length - 1, 0));

  /* ─── Restore (only finds data after an earlier opt-in) ─────────────── */
  useEffect(() => {
    const saved = store.load();
    if (!saved) return;
    setProgress(saved);
    setPersist(true);
    const restored = routeProfile(saved.answers);
    if (restored) {
      setView("guide");
      setActive(firstOpenStage(visibleStages(STAGES, restored), saved.done));
    }
    setStoreNotice("Restored your saved progress from this browser.");
  }, [store]);

  /* ─── Save on change, only while opted in ───────────────────────────── */
  useEffect(() => {
    if (!persist) return;
    const result = store.save(progress);
    if (!result.ok) setStoreNotice(result.reason);
  }, [persist, progress, store]);

  /* ─── Move focus to the new heading after navigation ────────────────── */
  useEffect(() => {
    const target = focusNext.current === "path" ? pathHeading : focusNext.current === "stage" ? stageHeading : null;
    focusNext.current = null;
    target?.current?.focus();
  }, [view, activeIndex]);

  function changeAnswers(answers: Answers) {
    setProgress((current) => setAnswers(current, answers));
  }

  function showGuide() {
    if (!profile) return;
    focusNext.current = "path";
    setActive(firstOpenStage(stages, progress.done));
    setView("guide");
  }

  function moveTo(index: number) {
    focusNext.current = "stage";
    setActive(index);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function toggle(stepId: string) {
    const next = toggleStep(progress, stepId);
    setProgress(next);
    const step = stages.flatMap((stage) => stage.steps).find((item) => item.id === stepId);
    const counts = completion(stages, next.done);
    setAnnouncement(
      `${next.done.includes(stepId) ? "Marked done" : "Marked not done"}: ${step?.title ?? "step"}. ${counts.done} of ${counts.total} steps complete.`,
    );
  }

  function changePersist(enabled: boolean) {
    setPersist(enabled);
    if (enabled) {
      const result = store.save(progress);
      setStoreNotice(result.ok ? "Saving to this browser only." : result.reason);
      return;
    }
    const result = store.clear();
    setStoreNotice(result.ok ? "Saved progress removed from this browser." : result.reason);
  }

  function download() {
    if (!profile) return;
    const isoDate = new Date().toISOString().slice(0, 10);
    downloadText(
      `${isoDate}_wifi-enterprise-checklist_v${GUIDE_VERSION}.md`,
      toMarkdown({ profile, stages, done: progress.done, isoDate, guideVersion: GUIDE_VERSION }),
    );
  }

  function reset() {
    if (!window.confirm("Clear all answers and progress on this page?")) return;
    store.clear();
    setPersist(false);
    setProgress(EMPTY_PROGRESS);
    setActive(0);
    setView("intake");
    setStoreNotice("");
  }

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10 text-text-primary sm:px-6 sm:py-12">
      <p className="mb-3 font-mono text-sm text-[color:var(--sp-brass-light)]">
        Field guide · Draft v{GUIDE_VERSION} · Updated {GUIDE_UPDATED}
      </p>
      <h1 className="font-heading text-4xl normal-case leading-tight tracking-normal">
        Give every device its own Wi-Fi key.
      </h1>
      <p className="mt-4 max-w-3xl text-text-secondary">
        Enterprise Wi-Fi (802.1X) replaces one shared password with a certificate on each device.
        You can lock out one lost laptop without changing anyone else's access.
      </p>

      <aside
        aria-labelledby="boundary-title"
        className="my-8 rounded-lg border border-dark-borderGlow bg-dark-surface p-5"
      >
        <h2 id="boundary-title" className="font-heading text-xl normal-case tracking-normal text-[color:var(--sp-brass-light)]">
          Before you start
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-text-secondary">
          <li>Six questions choose your path. Your answers stay in this browser. Nothing is sent anywhere.</li>
          <li>This page never asks for passwords, secrets, or names. Keep those in your password manager.</li>
          <li>
            This is a draft. The server commands were tested in a lab with step-ca and FreeRADIUS 3.2.5.
            Access-point and device steps follow vendor documentation and are not yet tested on real hardware.{" "}
            <a href={LAB_RECORD} className="underline underline-offset-4" rel="noopener noreferrer">
              Read the lab record
            </a>
            .
          </li>
        </ul>
      </aside>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {view === "intake" || !profile ? (
        <IntakeForm answers={progress.answers} onChange={changeAnswers} onSubmit={showGuide} />
      ) : (
        <div className="space-y-8">
          <PathSummary
            ref={pathHeading}
            profile={profile}
            totalLabel={totalLabel}
            onChangeAnswers={() => setView("intake")}
          />
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
              <ProgressPanel
                completion={summary}
                persist={persist}
                storeNotice={storeNotice}
                onPersistChange={changePersist}
                onDownload={download}
                onReset={reset}
              />
              <StageNav stages={stages} active={activeIndex} done={doneSet} onSelect={moveTo} />
            </div>
            {stages[activeIndex] && (
              <StageView
                ref={stageHeading}
                stage={stages[activeIndex]}
                index={activeIndex}
                count={stages.length}
                done={doneSet}
                onToggle={toggle}
                onMove={moveTo}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
