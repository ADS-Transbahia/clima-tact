"use client";

import { useActionState } from "react";
import type { Communication } from "@/server/services/communications";

type Action = (prevState: string | null, formData: FormData) => Promise<string | null>;

export function CommunicationForm({
  action,
  initial,
}: {
  action: Action;
  initial?: Communication;
}) {
  const [error, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-neutral-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initial?.title}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-neutral-700">
          Texto
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          defaultValue={initial?.body}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium text-neutral-700">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? "news"}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="news">Notícia</option>
            <option value="announcement">Comunicado</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="priority" className="text-sm font-medium text-neutral-700">
            Prioridade
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={initial?.priority ?? "normal"}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="coverImageUrl" className="text-sm font-medium text-neutral-700">
          Imagem de capa (URL, opcional)
        </label>
        <input
          id="coverImageUrl"
          name="coverImageUrl"
          type="url"
          defaultValue={initial?.cover_image_url ?? ""}
          placeholder="https://..."
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="requireReadConfirmation"
          defaultChecked={initial?.require_read_confirmation}
          className="h-4 w-4"
        />
        Exigir confirmação de leitura
      </label>

      {!initial && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="publish" defaultChecked className="h-4 w-4" />
          Publicar imediatamente
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
