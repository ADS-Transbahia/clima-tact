"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  listSurveyQuestions,
  submitSurveyResponse,
  type AnswerSubmission,
} from "@/server/services/surveys";

export async function submitResponseAction(
  surveyId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const questions = await listSurveyQuestions(supabase, surveyId);

  const answers: AnswerSubmission[] = [];

  for (const q of questions) {
    const field = `q_${q.id}`;

    if (q.type === "multi_choice") {
      const values = formData.getAll(field).map(String);
      if (values.length === 0) {
        if (q.required) return "Responda todas as perguntas obrigatórias.";
        continue;
      }
      answers.push({ question_id: q.id, answer: { option_ids: values } });
      continue;
    }

    const raw = formData.get(field);
    if (raw === null || raw === "") {
      if (q.required) return "Responda todas as perguntas obrigatórias.";
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
