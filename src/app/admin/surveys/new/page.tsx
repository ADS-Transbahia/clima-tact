"use client";

import { useActionState } from "react";
import { createSurveyAction } from "../actions";

export default function NewSurveyPage() {
  const [error, formAction, pending] = useActionState(createSurveyAction, null);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-500">Nova pesquisa</h2>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-neutral-700">
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-neutral-700">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="minResponses" className="text-sm font-medium text-neutral-700">
            Mínimo de respostas para exibir resultados
          </label>
          <input
            id="minResponses"
            name="minResponses"
            type="number"
            min={1}
            defaultValue={5}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <p className="text-xs text-neutral-400">
            Protege o anonimato: perguntas com menos respostas que esse número ficam
            ocultas no dashboard.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="isAnonymous" defaultChecked className="h-4 w-4" />
          Respostas anônimas
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="isPriority" className="h-4 w-4" />
          Pesquisa prioritária (pop-up para quem ainda não respondeu)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Criando..." : "Criar e adicionar perguntas"}
        </button>
      </form>
    </div>
  );
}
