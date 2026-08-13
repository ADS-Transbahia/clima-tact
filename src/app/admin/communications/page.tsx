import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listAllCommunications } from "@/server/services/communications";
import { changeCommunicationStatus } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  archived: "Arquivado",
};

const statusColor: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export default async function CommunicationsPage() {
  const supabase = await createClient();
  const communications = await listAllCommunications(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Comunicações</h2>
        <Link
          href="/admin/communications/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Nova comunicação
        </Link>
      </div>

      {communications.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma comunicação criada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {communications.map((item) => (
            <li key={item.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColor[item.status]}`}
                  >
                    {statusLabel[item.status]}
                  </span>
                  <h3 className="mt-1 font-medium text-neutral-900">{item.title}</h3>
                  <p className="text-xs text-neutral-400">
                    {item.type === "news" ? "Notícia" : "Comunicado"}
                    {item.priority === "high" && " · Prioridade alta"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Link
                    href={`/admin/communications/${item.id}`}
                    className="text-sm text-neutral-500 underline"
                  >
                    Editar
                  </Link>
                  {item.status !== "published" ? (
                    <form action={changeCommunicationStatus.bind(null, item.id, "published")}>
                      <button type="submit" className="text-sm text-green-700 underline">
                        Publicar
                      </button>
                    </form>
                  ) : (
                    <form action={changeCommunicationStatus.bind(null, item.id, "archived")}>
                      <button type="submit" className="text-sm text-neutral-500 underline">
                        Arquivar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
