import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  listActiveSurveys,
  hasParticipated,
  getSurveyDraft,
  listSurveyQuestions,
  computeProgress,
} from "@/server/services/surveys";

export default async function SurveysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const surveys = await listActiveSurveys(supabase);

  const items = await Promise.all(
    surveys.map(async (s) => {
      const done = await hasParticipated(supabase, s.id);
      if (done) return { survey: s, done, progress: 100 };

      const [draft, questions] = await Promise.all([
        getSurveyDraft(supabase, s.id),
        listSurveyQuestions(supabase, s.id),
      ]);
      return { survey: s, done, progress: computeProgress(questions, draft) };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-neutral-500 underline">
          &larr; Voltar ao feed
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Pesquisas</h1>
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma pesquisa disponível no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ survey: s, done, progress }) => (
            <li key={s.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-medium text-neutral-900">{s.title}</h2>
                  {s.description && (
                    <p className="mt-1 text-sm text-neutral-600">{s.description}</p>
                  )}
                  {!done && progress > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-32 rounded bg-neutral-100">
                        <div
                          className="h-1.5 rounded bg-neutral-900"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{progress}%</span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/surveys/${s.id}`}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                    done
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-neutral-900 text-white"
                  }`}
                >
                  {done ? "Respondida" : progress > 0 ? "Continuar" : "Responder"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
