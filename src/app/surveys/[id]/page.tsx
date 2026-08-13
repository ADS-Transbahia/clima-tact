import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSurvey, listSurveyQuestions, hasParticipated } from "@/server/services/surveys";
import { SurveyResponseForm } from "./SurveyResponseForm";

export default async function SurveyRespondPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const survey = await getSurvey(supabase, id);
  if (!survey || survey.status !== "active") notFound();

  const done = await hasParticipated(supabase, id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header>
        <Link href="/surveys" className="text-sm text-neutral-500 underline">
          &larr; Voltar às pesquisas
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">{survey.title}</h1>
        {survey.description && (
          <p className="mt-1 text-sm text-neutral-600">{survey.description}</p>
        )}
      </header>

      {done ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-8 text-center text-sm text-green-700">
          Obrigado! Sua resposta já foi registrada
          {survey.is_anonymous ? " de forma anônima." : "."}
        </p>
      ) : (
        <SurveyResponseForm
          surveyId={id}
          questions={await listSurveyQuestions(supabase, id)}
        />
      )}
    </main>
  );
}
