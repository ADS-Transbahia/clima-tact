"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSurvey,
  setSurveyStatus,
  addSurveyQuestion,
  deleteSurveyQuestion,
  listSurveyQuestions,
  questionNeedsOptions,
  type QuestionType,
  type SurveyStatus,
} from "@/server/services/surveys";

export async function createSurveyAction(_prevState: string | null, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isAnonymous = formData.get("isAnonymous") === "on";
  const isPriority = formData.get("isPriority") === "on";
  const minResponses = Number(formData.get("minResponses") ?? 5);

  if (!title) return "Preencha o título.";

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

  if (!profile) return "Perfil não encontrado.";

  let surveyId: string;
  try {
    surveyId = await createSurvey(supabase, profile.company_id, user.id, {
      title,
      description,
      isAnonymous,
      isPriority,
      minResponsesToShowResults: Number.isFinite(minResponses) ? minResponses : 5,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao criar pesquisa.";
  }

  revalidatePath("/admin/surveys");
  redirect(`/admin/surveys/${surveyId}`);
}

export async function changeSurveyStatusAction(id: string, status: SurveyStatus) {
  const supabase = await createClient();
  await setSurveyStatus(supabase, id, status);
  revalidatePath("/admin/surveys");
  revalidatePath(`/admin/surveys/${id}`);
  revalidatePath("/");
}

export async function addQuestionAction(
  surveyId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const text = String(formData.get("text") ?? "").trim();
  const type = String(formData.get("type") ?? "") as QuestionType;
  const required = formData.get("required") === "on";
  const section = String(formData.get("section") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "");
  const options = optionsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!text) return "Preencha o texto da pergunta.";
  if (questionNeedsOptions(type) && options.length < 2) {
    return "Adicione pelo menos duas opções (uma por linha).";
  }

  const supabase = await createClient();

  try {
    const existing = await listSurveyQuestions(supabase, surveyId);
    await addSurveyQuestion(supabase, surveyId, existing.length, {
      text,
      type,
      required,
      options,
      section,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao adicionar pergunta.";
  }

  revalidatePath(`/admin/surveys/${surveyId}`);
  return null;
}

export async function deleteQuestionAction(surveyId: string, questionId: string) {
  const supabase = await createClient();
  await deleteSurveyQuestion(supabase, questionId);
  revalidatePath(`/admin/surveys/${surveyId}`);
}
