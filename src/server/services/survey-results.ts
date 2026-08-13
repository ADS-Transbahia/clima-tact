import type { SupabaseClient } from "@supabase/supabase-js";
import { listSurveyQuestions, type QuestionType } from "./surveys";

type RawAnswer = { answer: unknown };

export type QuestionResult =
  | { kind: "hidden"; responseCount: number; minRequired: number }
  | {
      kind: "choice";
      responseCount: number;
      options: { label: string; count: number }[];
    }
  | { kind: "scale"; responseCount: number; average: number; max: number }
  | { kind: "yes_no"; responseCount: number; yes: number; no: number }
  | { kind: "text"; responseCount: number; answers: string[] };

export type SurveyQuestionResult = {
  questionId: string;
  text: string;
  type: QuestionType;
  result: QuestionResult;
};

const SCALE_MAX: Partial<Record<QuestionType, number>> = {
  scale_1_5: 5,
  stars: 5,
  scale_0_10: 10,
  nps: 10,
};

export async function getSurveyResults(
  supabase: SupabaseClient,
  surveyId: string,
  minResponsesToShowResults: number,
): Promise<SurveyQuestionResult[]> {
  const questions = await listSurveyQuestions(supabase, surveyId);
  const results: SurveyQuestionResult[] = [];

  for (const question of questions) {
    const { data, error } = await supabase
      .from("survey_answers")
      .select("answer")
      .eq("question_id", question.id);

    if (error) throw error;

    const answers = (data ?? []) as RawAnswer[];
    const responseCount = answers.length;

    if (responseCount < minResponsesToShowResults) {
      results.push({
        questionId: question.id,
        text: question.text,
        type: question.type,
        result: { kind: "hidden", responseCount, minRequired: minResponsesToShowResults },
      });
      continue;
    }

    results.push({
      questionId: question.id,
      text: question.text,
      type: question.type,
      result: aggregate(question.type, answers, question.survey_question_options),
    });
  }

  return results;
}

function aggregate(
  type: QuestionType,
  answers: RawAnswer[],
  options: { id: string; label: string }[],
): QuestionResult {
  const responseCount = answers.length;

  if (type === "single_choice" || type === "multi_choice") {
    const counts = new Map<string, number>();
    for (const { answer } of answers) {
      const ids =
        type === "single_choice"
          ? [(answer as { option_id?: string })?.option_id]
          : (answer as { option_ids?: string[] })?.option_ids ?? [];
      for (const id of ids) {
        if (!id) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return {
      kind: "choice",
      responseCount,
      options: options.map((o) => ({ label: o.label, count: counts.get(o.id) ?? 0 })),
    };
  }

  if (type === "yes_no") {
    let yes = 0;
    let no = 0;
    for (const { answer } of answers) {
      if ((answer as { value?: boolean })?.value) yes++;
      else no++;
    }
    return { kind: "yes_no", responseCount, yes, no };
  }

  if (type === "text") {
    return {
      kind: "text",
      responseCount,
      answers: answers.map((a) => String((a.answer as { text?: string })?.text ?? "")),
    };
  }

  const values = answers
    .map((a) => Number((a.answer as { value?: number })?.value))
    .filter((v) => !Number.isNaN(v));
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return {
    kind: "scale",
    responseCount,
    average,
    max: SCALE_MAX[type] ?? 10,
  };
}
