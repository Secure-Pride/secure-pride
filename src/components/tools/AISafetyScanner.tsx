import { useEffect, useRef, useState } from "react";
import {
  NO_MATCH_GUIDANCE,
  NO_MATCH_SCENARIOS,
  parseScanResponse,
  redactedDraft,
  scanFindings,
  scanSummary,
  type ScanResponse,
} from "./scanner-results";

const EXAMPLE =
  "Please contact the fictional volunteer at sample@example.org about next week's meeting.";
const INPUT_LIMIT = 50_000;

export default function AISafetyScanner() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(
    () => () => {
      revision.current += 1;
      request.current?.abort();
    },
    [],
  );

  function changeInput(value: string) {
    // Results belong to exactly one submission. Editing or clearing invalidates them.
    revision.current += 1;
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setText(value);
    setResult(null);
    setError("");
    setCopyNotice("");
  }

  async function runScan() {
    if (!text.trim() || busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const currentRevision = ++revision.current;
    setBusy(true);
    setResult(null);
    setError("");
    setCopyNotice("");
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), actor_id: "anonymous" }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 429)
          throw new Error("Too many requests. Wait a moment and try again.");
        throw new Error(
          "Scanner unavailable. No result is available; try again later.",
        );
      }
      const parsed = parseScanResponse(await response.json());
      if (currentRevision === revision.current && !controller.signal.aborted)
        setResult(parsed);
    } catch (failure) {
      if (currentRevision === revision.current)
        setError(
          controller.signal.aborted
            ? "The scan timed out. No result is available."
            : failure instanceof Error
              ? failure.message
              : "Scanner unavailable. No result is available.",
        );
    } finally {
      window.clearTimeout(timeout);
      if (currentRevision === revision.current) {
        setBusy(false);
        request.current = null;
      }
    }
  }

  async function copyDraft() {
    if (!result) return;
    const draft = redactedDraft(result);
    if (draft === null) return;
    const currentRevision = revision.current;
    try {
      await navigator.clipboard.writeText(draft);
      if (currentRevision === revision.current)
        setCopyNotice(
          "Draft copied. Review it before sharing; the clipboard may sync across devices.",
        );
    } catch {
      if (currentRevision === revision.current)
        setCopyNotice(
          "Clipboard access was unavailable. Select the draft and copy it manually.",
        );
    }
  }

  const draft = result ? redactedDraft(result) : null;
  const findings = result ? scanFindings(result) : [];
  const needsReview = result
    ? scanSummary(result) !== "No matching patterns detected"
    : false;
  const resultClass = !result
    ? ""
    : result.blocked
      ? "scanner-result scanner-result--withhold"
      : needsReview
        ? "scanner-result scanner-result--review"
        : "scanner-result scanner-result--clear";

  return (
    <div className="scanner">
      <aside className="scanner-plate" aria-labelledby="processing-title">
        <h2 id="processing-title">Before you submit</h2>
        <p id="processing-notice">
          Your text goes to our Cloudflare-hosted API. Do not submit real client
          records, passwords, health information, or identity details. Start
          with the invented example below.
        </p>
        <p>
          The application logs scan metadata, not submitted text. Hosting
          retention and processing locations remain unverified.{" "}
          <a href="/privacy/">Read privacy and processing</a>.
        </p>
      </aside>

      <form
        className="scanner-form"
        onSubmit={(event) => {
          event.preventDefault();
          void runScan();
        }}
      >
        <div className="scanner-form__row">
          <label htmlFor="scanInput" className="k-label">
            Text to check
          </label>
          <button
            type="button"
            onClick={() => changeInput(EXAMPLE)}
            className="k-button k-button--ghost-light"
          >
            Use invented example
          </button>
        </div>
        <textarea
          id="scanInput"
          value={text}
          onChange={(event) => changeInput(event.target.value)}
          maxLength={INPUT_LIMIT}
          rows={9}
          aria-describedby="processing-notice scan-hint"
          className="scanner-field"
          placeholder="Use example text you are authorized to share…"
        />
        <p id="scan-hint" className="scanner-hint">
          {text.length.toLocaleString()} / {INPUT_LIMIT.toLocaleString()}{" "}
          characters. Editing the text clears prior results.
        </p>
        <div className="actions">
          <button
            type="submit"
            disabled={!text.trim() || busy}
            aria-busy={busy}
            className="k-button k-button--opal"
          >
            {busy ? "Checking…" : "Run text check"}
          </button>
          <button
            type="button"
            onClick={() => changeInput("")}
            className="k-button k-button--ghost-light"
          >
            Clear
          </button>
        </div>
      </form>
      <p className="scanner-status" role="status" aria-live="polite" aria-atomic="true">
        {busy
          ? "Checking this submission…"
          : result
            ? scanSummary(result)
            : "No current scan result."}
      </p>
      {error && (
        <p role="alert" className="scanner-alert">
          {error}
        </p>
      )}
      {result && (
        <section className={resultClass} aria-labelledby="results-title">
          <h2 id="results-title">{scanSummary(result)}</h2>
          <p>
            {result.blocked
              ? "The scanner recommends withholding this submission. It has not blocked another app or AI provider; you control what happens next."
              : needsReview
                ? "Review each finding. A redacted draft can still contain sensitive context or missed patterns."
                : NO_MATCH_GUIDANCE}
          </p>
          {!result.blocked && !needsReview && (
            <p>
              Why no match is not clearance:{" "}
              {NO_MATCH_SCENARIOS.map((id, index) => (
                <span key={id}>
                  {index > 0 && " · "}
                  <a href={`/threat-model/scenarios/${id.toLowerCase()}/`}>
                    threat scenario {id}
                  </a>
                </span>
              ))}
            </p>
          )}
          <ul className="scanner-findings">
            {findings.map((finding, index) => (
              <li key={`${finding.name}-${index}`} className="scanner-finding">
                <p className="scanner-finding__name">
                  {finding.name}{" "}
                  <span className="scanner-finding__kind">
                    · {finding.kind === "block" ? "Withhold" : "Review"}
                  </span>
                </p>
                <p className="scanner-finding__detail">{finding.detail}</p>
              </li>
            ))}
          </ul>
          {draft !== null && (
            <div className="scanner-draft">
              <label htmlFor="redactedDraft" className="k-label">
                Redacted draft — review before sharing
              </label>
              <p>
                The original input above is unchanged. Review this version for
                missed details. Nothing is sent to an AI provider automatically.
              </p>
              <textarea
                id="redactedDraft"
                readOnly
                value={draft}
                rows={6}
                className="scanner-field"
              />
              <button
                type="button"
                onClick={() => void copyDraft()}
                className="k-button k-button--ghost-light"
              >
                Copy redacted draft
              </button>
              <p className="scanner-hint" role="status">
                {copyNotice}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
