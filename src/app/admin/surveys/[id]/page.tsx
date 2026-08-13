import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSurvey,
  listSurveyQuestions,
  QUESTION_TYPE_LABEL,
} from "@/server/services/surveys";
import { changeSurveyStatusAction, deleteQuestionAction } from "../actions";
import { AddQuestionForm } from "./AddQuestionForm";

const NEXT_STATUS: Record<string, { label: string; status: "active" | "closed" | "draft" }> = {
  draft: { label: "Ativar", status: "active" },
  scheduled: { label: "Ativar", status: "active" },
  active: { label: "Encerrar", status: "closed" },
  closed: { label: "Reabrir", status: "active" },
};

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const survey = await getSurvey(supabase, id);

  if (!survey) notFound();

  const questions = await listSurveyQuestions(supabase, id);
  const next = NEXT_STATUS[survey.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{survey.title}</h2>
          {survey.description && (
            <p className="mt-1 text-sm text-neutral-600">{survey.description}</p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            Status: {survey.status} · {survey.is_anonymous ? "Anônima" : "Identificada"}
            {survey.is_priority && " · Prioritária"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {next && (
            <form action={changeSurveyStatusAction.bind(null, id, next.status)}>
              <button type="submit" className="text-sm text-green-700 underline">
                {next.label}
              </button>
            </form>
          )}
          <Link href={`/admin/surveys/${id}/results`} className="text-sm text-neutral-500 underline">
            Ver resultados
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-neutral-500">
          Perguntas ({questions.length})
        </h3>
        {questions.map((q, i) => {
          const sectionChanged = q.section !== questions[i - 1]?.section;
          return (
            <div key={q.id}>
              {sectionChanged && q.section && (
                <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {q.section}
                </h4>
              )}
              <div className="rounded-md border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-900">
                      {i + 1}. {q.text}
                      {q.required && <span className="text-red-500"> *</span>}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {QUESTION_TYPE_LABEL[q.type]}
                    </p>
                    {q.survey_question_options.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-neutral-500">
                        {q.survey_question_options.map((o) => (
                          <li key={o.id}>{o.label}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <form action={deleteQuestionAction.bind(null, id, q.id)}>
                    <button type="submit" className="text-xs text-neutral-400 underline">
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}

        <AddQuestionForm surveyId={id} defaultSection={questions.at(-1)?.section ?? undefined} />
      </section>
    </div>
  );
}
