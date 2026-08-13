import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSurvey } from "@/server/services/surveys";
import { getSurveyResults } from "@/server/services/survey-results";

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const survey = await getSurvey(supabase, id);

  if (!survey) notFound();

  const results = await getSurveyResults(supabase, id, survey.min_responses_to_show_results);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/surveys/${id}`} className="text-sm text-neutral-500 underline">
          &larr; Voltar para a pesquisa
        </Link>
        <h2 className="text-lg font-semibold text-neutral-900">
          Resultados: {survey.title}
        </h2>
      </div>

      {results.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Esta pesquisa ainda não tem perguntas.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((r) => (
            <div key={r.questionId} className="rounded-md border border-neutral-200 p-4">
              <p className="text-sm font-medium text-neutral-900">{r.text}</p>

              {r.result.kind === "hidden" && (
                <p className="mt-2 text-sm text-neutral-400">
                  Resultados ocultos — {r.result.responseCount} de{" "}
                  {r.result.minRequired} respostas mínimas para proteger o anonimato.
                </p>
              )}

              {r.result.kind === "choice" && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-xs text-neutral-400">
                    {r.result.responseCount} respostas
                  </p>
                  {r.result.options.map((o) => (
                    <div key={o.label} className="flex items-center gap-2">
                      <div className="w-32 shrink-0 text-xs text-neutral-600">{o.label}</div>
                      <div className="h-2 flex-1 rounded bg-neutral-100">
                        <div
                          className="h-2 rounded bg-neutral-900"
                          style={{
                            width: `${r.result.responseCount ? (o.count / r.result.responseCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="w-6 shrink-0 text-right text-xs text-neutral-500">
                        {o.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {r.result.kind === "scale" && (
                <p className="mt-2 text-sm text-neutral-600">
                  Média: <strong>{r.result.average.toFixed(1)}</strong> / {r.result.max} ·{" "}
                  {r.result.responseCount} respostas
                </p>
              )}

              {r.result.kind === "yes_no" && (
                <p className="mt-2 text-sm text-neutral-600">
                  Sim: {r.result.yes} · Não: {r.result.no}
                </p>
              )}

              {r.result.kind === "text" && (
                <ul className="mt-2 flex flex-col gap-1">
                  {r.result.answers.map((a, i) => (
                    <li
                      key={i}
                      className="rounded bg-neutral-50 px-2 py-1 text-sm text-neutral-600"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
