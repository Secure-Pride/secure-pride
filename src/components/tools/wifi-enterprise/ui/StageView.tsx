/* ─── StageNav + StageView: where you are, and the steps in front of you ─ */

import { forwardRef } from "react";
import type { Stage } from "../types";
import StepCard from "./StepCard";

interface NavProps {
  stages: readonly Stage[];
  active: number;
  done: ReadonlySet<string>;
  onSelect: (index: number) => void;
}

export function StageNav({ stages, active, done, onSelect }: NavProps) {
  return (
    <nav aria-label="Guide stages">
      <ol className="space-y-1 p-0 [list-style:none]">
        {stages.map((stage, index) => {
          const finished = stage.steps.filter((step) => done.has(step.id)).length;
          const complete = finished === stage.steps.length;
          const current = index === active;
          return (
            <li key={stage.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={current ? "step" : undefined}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm ${
                  current
                    ? "border-(--sp-brass-light) bg-dark-elevated"
                    : "border-transparent hover:bg-dark-elevated"
                }`}
              >
                <span>
                  <span className="mr-2 font-mono text-xs text-text-secondary">{index + 1}</span>
                  {stage.title}
                </span>
                <span className={`shrink-0 font-mono text-xs ${complete ? "text-status-protected" : "text-text-secondary"}`}>
                  {complete ? "✓ done" : `${finished}/${stage.steps.length}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface ViewProps {
  stage: Stage;
  index: number;
  count: number;
  done: ReadonlySet<string>;
  onToggle: (stepId: string) => void;
  onMove: (index: number) => void;
}

export const StageView = forwardRef<HTMLHeadingElement, ViewProps>(function StageView(
  { stage, index, count, done, onToggle, onMove },
  headingRef,
) {
  return (
    <section aria-labelledby="stage-title" className="min-w-0">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">
        Stage {index + 1} of {count}
      </p>
      <h2
        id="stage-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-heading text-3xl normal-case tracking-normal"
      >
        {stage.title}
      </h2>
      <p className="mt-2 max-w-3xl text-text-secondary">{stage.summary}</p>

      <ol className="mt-6 space-y-5 p-0 [list-style:none]">
        {stage.steps.map((step, stepIndex) => (
          <StepCard key={step.id} step={step} index={stepIndex} done={done.has(step.id)} onToggle={onToggle} />
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          className="min-h-[44px] rounded-md border border-dark-borderGlow px-5 py-2 hover:bg-dark-elevated disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Previous stage
        </button>
        {index < count - 1 && (
          <button
            type="button"
            onClick={() => onMove(index + 1)}
            className="min-h-[44px] rounded-md bg-(--sp-brass-light) px-5 py-2 font-semibold text-dark-bg"
          >
            Next stage →
          </button>
        )}
      </div>
    </section>
  );
});
