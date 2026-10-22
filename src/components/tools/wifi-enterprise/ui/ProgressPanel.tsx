/* ─── ProgressPanel: progress bar, opt-in saving, export, reset ─────────
   Saving is off by default (DECISION-007). The label states exactly what
   is stored so the choice is informed. */

import { formatMinutes, type Completion } from "../progress";

interface Props {
  completion: Completion;
  persist: boolean;
  storeNotice: string;
  onPersistChange: (persist: boolean) => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function ProgressPanel({
  completion,
  persist,
  storeNotice,
  onPersistChange,
  onDownload,
  onReset,
}: Props) {
  return (
    <section aria-labelledby="progress-title" className="rounded-lg border border-dark-borderGlow bg-dark-surface p-5">
      <h2 id="progress-title" className="font-heading text-lg normal-case tracking-normal">
        Progress
      </h2>
      <progress
        max={completion.total}
        value={completion.done}
        aria-labelledby="progress-title"
        aria-describedby="progress-text"
        className="mt-3 h-3 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-status-protected [&::-webkit-progress-bar]:bg-dark-border [&::-webkit-progress-value]:bg-status-protected"
      />
      <p id="progress-text" className="mt-2 text-sm text-text-secondary">
        {completion.done} of {completion.total} steps · {completion.percent}% ·{" "}
        {completion.minutesLeft > 0 ? `about ${formatMinutes(completion.minutesLeft)} left` : "all done"}
      </p>

      <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={persist}
          onChange={(event) => onPersistChange(event.target.checked)}
          aria-describedby="persist-help"
          className="mt-0.5 h-5 w-5 shrink-0 accent-(--sp-brass-light)"
        />
        <span>
          <span className="block font-semibold">Remember my progress on this device</span>
          <span id="persist-help" className="block text-text-secondary">
            Saves only your answer choices and which steps are done, in this browser. Off by default.
          </span>
        </span>
      </label>
      <p role="status" className="min-h-5 text-xs text-text-secondary">
        {storeNotice}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="min-h-[44px] rounded-md border border-dark-borderGlow px-4 text-sm hover:bg-dark-elevated"
        >
          Download checklist (.md)
        </button>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] rounded-md border border-dark-borderGlow px-4 text-sm hover:bg-dark-elevated"
        >
          Start over
        </button>
      </div>
    </section>
  );
}
