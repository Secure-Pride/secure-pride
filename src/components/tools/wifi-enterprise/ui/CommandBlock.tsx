/* ─── CommandBlock: one labeled, copyable code block ────────────────────
   Code is rendered as text children only — never as HTML. The <pre> is
   focusable so keyboard users can scroll long lines horizontally. */

import { useId, useState } from "react";
import type { CommandBlock as Block } from "../types";

export default function CommandBlock({ block }: { block: Block }) {
  const labelId = useId();
  const [notice, setNotice] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setNotice("Copied. Replace the example values before running.");
    } catch {
      setNotice("Copy was blocked. Select the text and copy it by hand.");
    }
  }

  return (
    <figure className="mt-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption id={labelId} className="font-mono text-xs text-text-secondary">
          {block.label}
        </figcaption>
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-[44px] rounded-md border border-dark-borderGlow px-4 text-sm hover:bg-dark-elevated"
        >
          Copy
          <span className="sr-only"> {block.label}</span>
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-labelledby={labelId}
        className="mt-2 max-w-full overflow-x-auto rounded-md border border-dark-border bg-dark-void p-4 font-mono text-[0.8rem] leading-relaxed text-text-primary"
      >
        <code>{block.code}</code>
      </pre>
      <p role="status" className="mt-1 min-h-[1.25rem] text-xs text-text-secondary">
        {notice}
      </p>
    </figure>
  );
}
