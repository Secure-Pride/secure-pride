/* ─── StepCard: one step with its done checkbox ─────────────────────────
   The checkbox is the only interactive state here; everything else is
   static content from the stage data. */

import type { Step } from "../types";
import CommandBlock from "./CommandBlock";

interface Props {
  step: Step;
  index: number;
  done: boolean;
  onToggle: (stepId: string) => void;
}

export default function StepCard({ step, index, done, onToggle }: Props) {
  const checkboxId = `done-${step.id}`;
  const titleId = `title-${step.id}`;

  return (
    <li
      aria-labelledby={titleId}
      className={`rounded-lg border bg-dark-surface p-5 ${
        done ? "border-status-protected" : "border-dark-borderGlow"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={titleId} className="font-heading text-xl normal-case leading-snug tracking-normal">
          <span className="mr-2 font-mono text-sm text-(--sp-brass-light)">
            {String(index + 1).padStart(2, "0")}
          </span>
          {step.title}
        </h3>
        <span className="font-mono text-xs text-text-secondary">~{step.minutes} min</span>
      </div>

      <p className="mt-2 text-text-secondary">{step.why}</p>

      <ol className="mt-4 list-decimal space-y-2 pl-6">
        {step.actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ol>

      {step.commands?.map((block) => (
        <CommandBlock key={block.label} block={block} />
      ))}

      {step.watchOut && (
        <p className="mt-4 border-l-2 border-status-warning pl-4 text-sm">
          <strong className="font-semibold text-status-warning">Watch out: </strong>
          {step.watchOut}
        </p>
      )}

      {step.reference && (
        <p className="mt-3 text-sm">
          <a
            href={step.reference.href}
            rel="noopener noreferrer"
            target="_blank"
            className="underline underline-offset-4"
          >
            {step.reference.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}

      <div className="mt-5 rounded-md border border-dark-border bg-dark-bg p-4">
        <p className="text-sm">
          <strong className="font-semibold">Done when: </strong>
          {step.doneWhen}
        </p>
        <label
          htmlFor={checkboxId}
          className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-3 font-semibold"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={done}
            onChange={() => onToggle(step.id)}
            className="h-5 w-5 accent-(--sp-status-protected)"
          />
          {done ? "Done" : "Mark this step done"}
          <span className="sr-only">: {step.title}</span>
        </label>
      </div>
    </li>
  );
}
