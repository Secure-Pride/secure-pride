/* ─── IntakeForm: six questions → one path ──────────────────────────────
   Native radios and checkboxes in fieldsets. Submitting with gaps names
   the missing questions in an alert and moves focus to the first one. */

import { useRef, useState, type FormEvent } from "react";
import { QUESTIONS, sanitizeAnswers, unansweredQuestions } from "../paths";
import type { Answers, Question } from "../types";

interface Props {
  answers: Answers;
  onChange: (answers: Answers) => void;
  onSubmit: () => void;
}

function isChecked(answers: Answers, question: Question, optionId: string): boolean {
  const value = answers[question.id];
  return Array.isArray(value) ? value.includes(optionId) : value === optionId;
}

function nextAnswers(answers: Answers, question: Question, optionId: string): Answers {
  if (question.kind === "single") return { ...answers, [question.id]: optionId };
  const current = answers[question.id];
  const list = Array.isArray(current) ? current : [];
  const updated = list.includes(optionId)
    ? list.filter((id) => id !== optionId)
    : [...list, optionId];
  return sanitizeAnswers({ ...answers, [question.id]: updated });
}

export default function IntakeForm({ answers, onChange, onSubmit }: Props) {
  const [missing, setMissing] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const answered = QUESTIONS.length - unansweredQuestions(answers).length;

  function submit(event: FormEvent) {
    event.preventDefault();
    const gaps = unansweredQuestions(answers);
    setMissing(gaps);
    if (gaps.length === 0) {
      onSubmit();
      return;
    }
    formRef.current?.querySelector<HTMLInputElement>(`fieldset[data-q="${gaps[0]}"] input`)?.focus();
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-describedby="intake-count">
      <p id="intake-count" className="mb-6 font-mono text-sm text-text-secondary">
        {answered} of {QUESTIONS.length} answered · Answers stay in this browser.
      </p>
      <ol className="space-y-6 p-0 [list-style:none]">
        {QUESTIONS.map((question, index) => {
          const isMissing = missing.includes(question.id) && unansweredQuestions(answers).includes(question.id);
          return (
            <li key={question.id}>
              <fieldset
                data-q={question.id}
                aria-describedby={`help-${question.id}`}
                className={`rounded-lg border bg-dark-surface p-5 ${
                  isMissing ? "border-status-warning" : "border-dark-borderGlow"
                }`}
              >
                <legend className="px-1 font-heading text-xl font-semibold normal-case tracking-normal">
                  <span className="mr-2 font-mono text-sm text-(--sp-brass-light)">
                    {index + 1}/{QUESTIONS.length}
                  </span>
                  {question.prompt}
                </legend>
                <p id={`help-${question.id}`} className="mt-1 text-sm text-text-secondary">
                  {question.help}
                </p>
                {isMissing && (
                  <p className="mt-2 text-sm font-semibold text-status-warning">Choose an answer to continue.</p>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const id = `${question.id}-${option.id}`;
                    return (
                      <label
                        key={option.id}
                        htmlFor={id}
                        className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md border border-dark-border p-3 hover:bg-dark-elevated has-checked:border-(--sp-brass-light)"
                      >
                        <input
                          id={id}
                          type={question.kind === "single" ? "radio" : "checkbox"}
                          name={question.id}
                          value={option.id}
                          checked={isChecked(answers, question, option.id)}
                          onChange={() => onChange(nextAnswers(answers, question, option.id))}
                          className="mt-1 h-5 w-5 shrink-0 accent-(--sp-brass-light)"
                        />
                        <span>
                          <span className="block">{option.label}</span>
                          {option.hint && (
                            <span className="block text-sm text-text-secondary">{option.hint}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      {missing.length > 0 && unansweredQuestions(answers).length > 0 && (
        <p role="alert" className="mt-6 rounded-lg border border-status-warning bg-dark-surface p-4">
          {unansweredQuestions(answers).length} question(s) still need an answer.
        </p>
      )}
      <button
        type="submit"
        className="mt-6 min-h-[44px] rounded-md bg-(--sp-brass-light) px-6 py-3 font-semibold text-dark-bg"
      >
        Show my path
      </button>
    </form>
  );
}
