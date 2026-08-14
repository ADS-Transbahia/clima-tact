import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCommunication } from "@/server/services/communications";
import { listBlocks, BLOCK_TYPE_LABEL } from "@/server/services/communication-blocks";
import { CommunicationForm } from "../CommunicationForm";
import { updateCommunicationAction, changeCommunicationStatus, deleteBlockAction } from "../actions";
import { AddBlockForm } from "./AddBlockForm";

export default async function EditCommunicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const communication = await getCommunication(supabase, id);

  if (!communication) notFound();

  const blocks = await listBlocks(supabase, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Editar comunicação</h2>
        <div className="flex gap-3">
          <Link href={`/communications/${id}`} className="text-sm text-neutral-500 underline">
            Ver como colaborador
          </Link>
          {communication.status !== "published" && (
            <form action={changeCommunicationStatus.bind(null, id, "published")}>
              <button type="submit" className="text-sm text-green-700 underline">
                Publicar
              </button>
            </form>
          )}
          {communication.status !== "archived" && (
            <form action={changeCommunicationStatus.bind(null, id, "archived")}>
              <button type="submit" className="text-sm text-neutral-500 underline">
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>
      <CommunicationForm action={updateCommunicationAction} initial={communication} />

      <section className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
        <h3 className="text-sm font-medium text-neutral-500">
          Conteúdo adicional ({blocks.length})
        </h3>
        <p className="text-xs text-neutral-400">
          Blocos aparecem na página completa da comunicação, na ordem em que forem
          adicionados: imagens extras, arquivos pra baixar, botões de ação (inclusive
          linkando pra uma pesquisa) e checklists.
        </p>

        {blocks.map((b) => (
          <div
            key={b.id}
            className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 p-4"
          >
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {BLOCK_TYPE_LABEL[b.type]}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {b.type === "text" && String(b.config.text)}
                {b.type === "image" && String(b.config.url)}
                {(b.type === "file" || b.type === "button") &&
                  `${b.config.label} → ${b.config.url}`}
                {b.type === "checklist" &&
                  (b.config.items as string[]).join(" · ")}
              </p>
            </div>
            <form action={deleteBlockAction.bind(null, id, b.id)}>
              <button type="submit" className="text-xs text-neutral-400 underline">
                Remover
              </button>
            </form>
          </div>
        ))}

        <AddBlockForm communicationId={id} />
      </section>
    </div>
  );
}
