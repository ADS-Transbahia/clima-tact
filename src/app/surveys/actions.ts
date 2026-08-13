"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  listSurveyQuestions,
  submitSurveyResponse,
  saveSurveyDraft,
  type AnswerSubmission,
  type SurveyQuestion,
} from "@/server/services/surveys";

function parseAnswersFromForm(questions: SurveyQuestion[], formData: FormData) {
  const answers: AnswerSubmission[] = [];
  let missingRequired = false;

  for (const q of questions) {
    const field = `q_${q.id}`;

    if (q.type === "multi_choice") {
      const values = formData.getAll(field).map(String);
      if (values.length === 0) {
        if (q.required) missingRequired = true;
        continue;
      }
      answers.push({ question_id: q.id, answer: { option_ids: values } });
      continue;
    }

    const raw = formData.get(field);
    if (raw === null || raw === "") {
      if (q.required) missingRequired = true;
      continue;
    }

    if (q.type === "single_choice") {
      answers.push({ question_id: q.id, answer: { option_id: String(raw) } });
    } else if (q.type === "yes_no") {
      answers.push({ question_id: q.id, answer: { value: raw === "true" } });
    } else if (q.type === "text") {
      answers.push({ question_id: q.id, answer: { text: String(raw).trim() } });
    } else {
      answers.push({ question_id: q.id, answer: { value: Number(raw) } });
    }
  }

  return { answers, missingRequired };
}

export async function submitResponseAction(
  surveyId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const questions = await listSurveyQuestions(supabase, surveyId);
  const { answers, missingRequired } = parseAnswersFromForm(questions, formData);

  if (missingRequired) return "Responda todas as perguntas obrigatórias.";

  try {
    await submitSurveyResponse(supabase, surveyId, answers);
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao enviar respostas. Tente novamente.";
  }

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath("/surveys");
  revalidatePath("/");
  redirect(`/surveys/${surveyId}`);
}

export async function saveDraftAction(surveyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/surveys");

  const questions = await listSurveyQuestions(supabase, surveyId);
  const { answers } = parseAnswersFromForm(questions, formData);
  const answersMap = Object.fromEntries(answers.map((a) => [a.question_id, a.answer]));

  await saveSurveyDraft(supabase, surveyId, profile.company_id, user.id, answersMap);

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath("/surveys");
  redirect(`/surveys/${surveyId}`);
}
