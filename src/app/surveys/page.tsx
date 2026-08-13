import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listActiveSurveys, hasParticipated } from "@/server/services/surveys";

export default async function SurveysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const surveys = await listActiveSurveys(supabase);
  const statuses = await Promise.all(
    surveys.map((s) => hasParticipated(supabase, s.id)),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-neutral-500 underline">
          &larr; Voltar ao feed
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Pesquisas</h1>
      </header>

      {surveys.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma pesquisa disponível no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {surveys.map((s, i) => (
            <li key={s.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium text-neutral-900">{s.title}</h2>
                  {s.description && (
                    <p className="mt-1 text-sm text-neutral-600">{s.description}</p>
                  )}
                </div>
                <Link
                  href={`/surveys/${s.id}`}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                    statuses[i]
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-neutral-900 text-white"
                  }`}
                >
                  {statuses[i] ? "Respondida" : "Responder"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
