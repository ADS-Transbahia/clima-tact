import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listAllSurveys } from "@/server/services/surveys";

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  active: "Ativa",
  closed: "Encerrada",
};

const statusColor: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-neutral-100 text-neutral-400",
};

export default async function SurveysPage() {
  const supabase = await createClient();
  const surveys = await listAllSurveys(supabase);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Pesquisas</h2>
        <Link
          href="/admin/surveys/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Nova pesquisa
        </Link>
      </div>

      {surveys.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma pesquisa criada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {surveys.map((s) => (
            <li key={s.id} className="rounded-md border border-neutral-200 p-4">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColor[s.status]}`}
              >
                {statusLabel[s.status]}
              </span>
              {s.is_priority && (
                <span className="ml-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Prioritária
                </span>
              )}
              <h3 className="mt-1 font-medium text-neutral-900">
                <Link href={`/admin/surveys/${s.id}`} className="hover:underline">
                  {s.title}
                </Link>
              </h3>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
