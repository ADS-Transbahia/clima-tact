"use client";

import { useActionState } from "react";
import { submitResponseAction } from "../actions";
import type { SurveyQuestion } from "@/server/services/surveys";

const SCALE_MAX: Record<string, number> = {
  scale_1_5: 5,
  stars: 5,
  scale_0_10: 10,
  nps: 10,
};

function QuestionField({ question }: { question: SurveyQuestion }) {
  const field = `q_${question.id}`;

  if (question.type === "single_choice") {
    return (
      <div className="flex flex-col gap-2">
        {question.survey_question_options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="radio" name={field} value={o.id} required={question.required} />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multi_choice") {
    return (
      <div className="flex flex-col gap-2">
        {question.survey_question_options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name={field} value={o.id} />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="radio" name={field} value="true" required={question.required} />
          Sim
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="radio" name={field} value="false" required={question.required} />
          Não
        </label>
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <textarea
        name={field}
        rows={3}
        required={question.required}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
    );
  }

  const max = SCALE_MAX[question.type] ?? 10;
  const min = question.type === "scale_0_10" || question.type === "nps" ? 0 : 1;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

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
            className="sr-only"
          />
          {v}
        </label>
      ))}
    </div>
  );
}

export function SurveyResponseForm({
  surveyId,
  questions,
}: {
  surveyId: string;
  questions: SurveyQuestion[];
}) {
  const action = submitResponseAction.bind(null, surveyId);
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2">
          <p className="text-sm font-medium text-neutral-900">
            {i + 1}. {q.text}
            {q.required && <span className="text-red-500"> *</span>}
          </p>
          <QuestionField question={q} />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar respostas"}
      </button>
    </form>
  );
}
