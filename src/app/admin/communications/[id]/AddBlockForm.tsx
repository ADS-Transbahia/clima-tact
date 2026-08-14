"use client";

import { useActionState, useState } from "react";
import { addBlockAction } from "../actions";
import { BLOCK_TYPE_LABEL, type BlockType } from "@/server/services/communication-blocks";

export function AddBlockForm({ communicationId }: { communicationId: string }) {
  const action = addBlockAction.bind(null, communicationId);
  const [error, formAction, pending] = useActionState(action, null);
  const [type, setType] = useState<BlockType>("text");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="blockType" className="text-sm font-medium text-neutral-700">
          Tipo de bloco
        </label>
        <select
          id="blockType"
          name="blockType"
          value={type}
          onChange={(e) => setType(e.target.value as BlockType)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {Object.entries(BLOCK_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {type === "text" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="blockText" className="text-sm font-medium text-neutral-700">
            Texto
          </label>
          <textarea
            id="blockText"
            name="blockText"
            rows={4}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
      )}

      {type === "image" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="blockUrl" className="text-sm font-medium text-neutral-700">
              URL da imagem
            </label>
            <input
              id="blockUrl"
              name="blockUrl"
              type="text"
              placeholder="https://..."
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="blockCaption" className="text-sm font-medium text-neutral-700">
              Legenda (opcional)
            </label>
            <input
              id="blockCaption"
              name="blockCaption"
              type="text"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
        </>
      )}

      {(type === "file" || type === "button") && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="blockUrl" className="text-sm font-medium text-neutral-700">
              URL {type === "file" ? "do arquivo" : "de destino"}
            </label>
            <input
              id="blockUrl"
              name="blockUrl"
              type="text"
              placeholder={type === "button" ? "https://... ou /surveys/..." : "https://..."}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="blockLabel" className="text-sm font-medium text-neutral-700">
              Texto do {type === "file" ? "link" : "botão"}
            </label>
            <input
              id="blockLabel"
              name="blockLabel"
              type="text"
              placeholder={type === "file" ? "Baixar comunicado" : "Preencher ficha de recebimento"}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
        </>
      )}

      {type === "checklist" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="blockItems" className="text-sm font-medium text-neutral-700">
            Itens (um por linha)
          </label>
          <textarea
            id="blockItems"
            name="blockItems"
            rows={4}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adicionando..." : "Adicionar bloco"}
      </button>
    </form>
  );
}
