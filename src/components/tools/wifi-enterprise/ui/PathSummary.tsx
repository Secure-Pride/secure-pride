/* ─── PathSummary: which path, why, and what the examples mean ───────── */

import { forwardRef } from "react";
import { PLACEHOLDERS } from "../content";
import { PATH_LABELS } from "../paths";
import type { Profile } from "../types";

interface Props {
  profile: Profile;
  totalLabel: string;
  onChangeAnswers: () => void;
}

const PathSummary = forwardRef<HTMLHeadingElement, Props>(function PathSummary(
  { profile, totalLabel, onChangeAnswers },
  headingRef,
) {
  const label = PATH_LABELS[profile.path];
  return (
    <section aria-labelledby="path-title" className="rounded-lg border border-dark-borderGlow bg-dark-surface p-5">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Your path · {totalLabel}</p>
      <h2
        id="path-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-heading text-3xl normal-case tracking-normal text-[color:var(--sp-brass-highlight)]"
      >
        {label.title}
      </h2>
      <p className="mt-2 text-text-secondary">{label.summary}</p>

      <h3 className="mt-4 font-heading text-lg normal-case tracking-normal">Why this path</h3>
      <ul className="mt-1 list-disc space-y-1 pl-6 text-sm">
        {profile.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      {profile.path !== "not-yet" && (
        <details className="mt-4 rounded-md border border-dark-border bg-dark-bg p-4">
          <summary className="min-h-[44px] cursor-pointer content-center font-semibold">
            Example values used in commands
          </summary>
          <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
            {PLACEHOLDERS.map((item) => (
              <div key={item.example} className="contents">
                <dt className="font-mono text-[color:var(--sp-brass-light)]">{item.example}</dt>
                <dd className="text-text-secondary">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <button
        type="button"
        onClick={onChangeAnswers}
        className="mt-4 min-h-[44px] rounded-md border border-dark-borderGlow px-5 py-2 hover:bg-dark-elevated"
      >
        Change my answers
      </button>
    </section>
  );
});

export default PathSummary;
