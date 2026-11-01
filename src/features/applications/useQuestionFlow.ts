import type { ApplicationDetail } from "@/api/dto";
import { KEYS } from "@/lib/localStore";
import type { FieldSpec, Values } from "@/features/microflow/types";

/** Campos do formulário dinâmico: um por tela, com o controle certo para cada tipo de resposta. */
export function formFieldsToSpecs(fields: ApplicationDetail.FormField[]): FieldSpec[] {
  return fields.map((field): FieldSpec => {
    const base = { key: String(field.id), title: field.question };
    switch (field.response_type) {
      case "boolean":
        return { ...base, kind: "choice", options: [{ label: "Sim", value: true }, { label: "Não", value: false }] };
      case "date":
        return { ...base, kind: "date", label: field.question };
      case "number":
        return { ...base, kind: "text", label: "Sua resposta", keyboardType: "numeric", validate: (value) => (Number.isFinite(Number(String(value).replace(",", "."))) ? null : "Informe um número.") };
      case "text":
        return { ...base, kind: "multiline", label: "Sua resposta", maxLength: 2000 };
      default:
        return { ...base, kind: "text", label: "Sua resposta" };
    }
  });
}

/** Perguntas da prova: cada alternativa é um cartão de toque que já avança. */
export function examQuestionsToSpecs(questions: ApplicationDetail.ExamQuestion[]): FieldSpec[] {
  return questions.map((question, index) => ({
    key: String(question.id),
    kind: "choice",
    title: question.text,
    options: question.alternatives.map((alternative) => ({ label: alternative.text, value: String(alternative.id) })),
    // A última resposta não envia a prova sozinha: o envio é uma ação deliberada (botão "Enviar prova").
    autoAdvance: index < questions.length - 1,
  }));
}

export function toFormResponses(values: Values): Record<number, { response: string | number | boolean }> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([id, value]) => [Number(id), { response: typeof value === "boolean" || typeof value === "number" ? value : String(value) }]),
  );
}

export function toExamResponses(values: Values): { question_id: number; alternative_id: number }[] {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([questionId, alternativeId]) => ({ question_id: Number(questionId), alternative_id: Number(alternativeId) }));
}

export const draftKey = (kind: "form" | "exam", applicationId: number) => KEYS.formDraft(kind, applicationId);
