"use client";

import { useActionState, useState } from "react";
import { addQuestionAction } from "../actions";
import { QUESTION_TYPE_LABEL, questionNeedsOptions, type QuestionType } from "@/server/services/surveys";

export function AddQuestionForm({
  surveyId,
  defaultSection,
}: {
  surveyId: string;
  defaultSection?: string;
}) {
  const action = addQuestionAction.bind(null, surveyId);
  const [error, formAction, pending] = useActionState(action, null);
  const [type, setType] = useState<QuestionType>("single_choice");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="section" className="text-sm font-medium text-neutral-700">
          Seção (opcional)
        </label>
        <input
          id="section"
          name="section"
          type="text"
          defaultValue={defaultSection}
          placeholder="Ex: Comunicação"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="text" className="text-sm font-medium text-neutral-700">
          Pergunta
        </label>
        <input
          id="text"
          name="text"
          type="text"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-neutral-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {questionNeedsOptions(type) && (
        <div className="flex flex-col gap-1">
          <label htmlFor="options" className="text-sm font-medium text-neutral-700">
            Opções (uma por linha)
          </label>
          <textarea
            id="options"
            name="options"
            rows={4}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="required" defaultChecked className="h-4 w-4" />
        Obrigatória
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adicionando..." : "Adicionar pergunta"}
      </button>
    </form>
  );
}
