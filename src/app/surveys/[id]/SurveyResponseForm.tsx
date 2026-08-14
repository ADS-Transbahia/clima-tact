"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitResponseAction, saveDraftAction } from "../actions";
import type { DraftAnswers, SurveyQuestion } from "@/server/services/surveys";

const SCALE_MAX: Record<string, number> = {
  scale_1_5: 5,
  stars: 5,
  scale_0_10: 10,
  nps: 10,
};

function QuestionField({
  question,
  defaultAnswer,
}: {
  question: SurveyQuestion;
  defaultAnswer: unknown;
}) {
  const field = `q_${question.id}`;

  if (question.type === "single_choice") {
    const selected = (defaultAnswer as { option_id?: string })?.option_id;
    return (
      <div className="flex flex-col gap-2">
        {question.survey_question_options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name={field}
              value={o.id}
              required={question.required}
              defaultChecked={selected === o.id}
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multi_choice") {
    const selected = (defaultAnswer as { option_ids?: string[] })?.option_ids ?? [];
    return (
      <div className="flex flex-col gap-2">
        {question.survey_question_options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name={field}
              value={o.id}
              defaultChecked={selected.includes(o.id)}
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "yes_no") {
    const selected = (defaultAnswer as { value?: boolean })?.value;
    return (
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="radio"
            name={field}
            value="true"
            required={question.required}
            defaultChecked={selected === true}
          />
          Sim
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="radio"
            name={field}
            value="false"
            required={question.required}
            defaultChecked={selected === false}
          />
          Não
        </label>
      </div>
    );
  }

  if (question.type === "text") {
    const text = (defaultAnswer as { text?: string })?.text ?? "";
    return (
      <textarea
        name={field}
        rows={3}
        required={question.required}
        defaultValue={text}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
    );
  }

  const max = SCALE_MAX[question.type] ?? 10;
  const min = question.type === "scale_0_10" || question.type === "nps" ? 0 : 1;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const selectedValue = (defaultAnswer as { value?: number })?.value;

  return (
    <div className="flex flex-wrap gap-3">
      {values.map((v) => (
        <label
          key={v}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-sm text-neutral-700 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
        >
          <input
            type="radio"
            name={field}
            value={v}
            required={question.required}
            defaultChecked={selectedValue === v}
            className="sr-only"
          />
          {v}
        </label>
      ))}
    </div>
  );
}

function SaveDraftButton({ action }: { action: (formData: FormData) => Promise<void> }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      disabled={pending}
      className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar e continuar depois"}
    </button>
  );
}

export function SurveyResponseForm({
  surveyId,
  questions,
  draft,
}: {
  surveyId: string;
  questions: SurveyQuestion[];
  draft: DraftAnswers | null;
}) {
  const submitAction = submitResponseAction.bind(null, surveyId);
  const draftAction = saveDraftAction.bind(null, surveyId);
  const [error, formAction, pending] = useActionState(submitAction, null);

  let lastSection: string | null | undefined = undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {questions.map((q, i) => {
        const sectionChanged = q.section !== lastSection;
        lastSection = q.section;
        return (
          <div key={q.id} className="flex flex-col gap-2">
            {sectionChanged && q.section && (
              <h2 className="mt-2 border-b border-neutral-200 pb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {q.section}
              </h2>
            )}
            <p className="text-sm font-medium text-neutral-900">
              {i + 1}. {q.text}
              {q.required && <span className="text-red-500"> *</span>}
            </p>
            <QuestionField question={q} defaultAnswer={draft?.[q.id]} />
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Enviar respostas"}
        </button>
        <SaveDraftButton action={draftAction} />
      </div>
    </form>
  );
}
