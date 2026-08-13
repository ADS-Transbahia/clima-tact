import type { SupabaseClient } from "@supabase/supabase-js";

export type SurveyStatus = "draft" | "scheduled" | "active" | "closed";

export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "scale_1_5"
  | "scale_0_10"
  | "nps"
  | "text"
  | "yes_no"
  | "stars";

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: "Escolha única",
  multi_choice: "Múltipla escolha",
  scale_1_5: "Escala 1-5",
  scale_0_10: "Escala 0-10",
  nps: "NPS (0-10)",
  text: "Texto livre",
  yes_no: "Sim/Não",
  stars: "Estrelas (1-5)",
};

const NEEDS_OPTIONS = new Set<QuestionType>(["single_choice", "multi_choice"]);

export function questionNeedsOptions(type: QuestionType) {
  return NEEDS_OPTIONS.has(type);
}

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  is_anonymous: boolean;
  is_priority: boolean;
  min_responses_to_show_results: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type SurveyQuestionOption = {
  id: string;
  label: string;
  order: number;
};

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  order: number;
  text: string;
  required: boolean;
  type: QuestionType;
  survey_question_options: SurveyQuestionOption[];
};

const SURVEY_COLUMNS =
  "id, title, description, status, is_anonymous, is_priority, min_responses_to_show_results, starts_at, ends_at, created_at";

export async function listAllSurveys(supabase: SupabaseClient): Promise<Survey[]> {
  const { data, error } = await supabase
    .from("surveys")
    .select(SURVEY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listActiveSurveys(supabase: SupabaseClient): Promise<Survey[]> {
  const { data, error } = await supabase
    .from("surveys")
    .select(SURVEY_COLUMNS)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSurvey(
  supabase: SupabaseClient,
  id: string,
): Promise<Survey | null> {
  const { data, error } = await supabase
    .from("surveys")
    .select(SURVEY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type SurveyInput = {
  title: string;
  description: string;
  isAnonymous: boolean;
  isPriority: boolean;
  minResponsesToShowResults: number;
};

export async function createSurvey(
  supabase: SupabaseClient,
  companyId: string,
  createdBy: string,
  input: SurveyInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      company_id: companyId,
      created_by: createdBy,
      title: input.title,
      description: input.description || null,
      is_anonymous: input.isAnonymous,
      is_priority: input.isPriority,
      min_responses_to_show_results: input.minResponsesToShowResults,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function setSurveyStatus(
  supabase: SupabaseClient,
  id: string,
  status: SurveyStatus,
) {
  const { error } = await supabase.from("surveys").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function listSurveyQuestions(
  supabase: SupabaseClient,
  surveyId: string,
): Promise<SurveyQuestion[]> {
  const { data, error } = await supabase
    .from("survey_questions")
    .select("id, survey_id, order, text, required, type, survey_question_options(id, label, order)")
    .eq("survey_id", surveyId)
    .order("order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((q) => ({
    ...q,
    survey_question_options: (q.survey_question_options ?? []).sort(
      (a: SurveyQuestionOption, b: SurveyQuestionOption) => a.order - b.order,
    ),
  })) as SurveyQuestion[];
}

export type QuestionInput = {
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
};

export async function addSurveyQuestion(
  supabase: SupabaseClient,
  surveyId: string,
  order: number,
  input: QuestionInput,
) {
  const { data, error } = await supabase
    .from("survey_questions")
    .insert({
      survey_id: surveyId,
      order,
      text: input.text,
      required: input.required,
      type: input.type,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (questionNeedsOptions(input.type) && input.options.length > 0) {
    const rows = input.options.map((label, i) => ({
      question_id: data.id,
      label,
      order: i,
    }));
    const { error: optionsError } = await supabase
      .from("survey_question_options")
      .insert(rows);
    if (optionsError) throw optionsError;
  }
}

export async function deleteSurveyQuestion(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("survey_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function hasParticipated(
  supabase: SupabaseClient,
  surveyId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("survey_participation")
    .select("id")
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export type AnswerSubmission = {
  question_id: string;
  answer: unknown;
};

export async function submitSurveyResponse(
  supabase: SupabaseClient,
  surveyId: string,
  answers: AnswerSubmission[],
) {
  const { error } = await supabase.rpc("submit_survey_response", {
    p_survey_id: surveyId,
    p_answers: answers,
  });
  if (error) throw error;
}

export async function getPendingPrioritySurvey(
  supabase: SupabaseClient,
): Promise<Survey | null> {
  const surveys = await listActiveSurveys(supabase);
  const priority = surveys.filter((s) => s.is_priority);

  for (const survey of priority) {
    const done = await hasParticipated(supabase, survey.id);
    if (!done) return survey;
  }

  return null;
}
