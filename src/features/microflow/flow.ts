import { type FieldSpec, type Values, isBlank } from "./types";

/** Campos que aparecem agora (alguns só fazem sentido conforme respostas anteriores). */
export function visibleFields(fields: FieldSpec[], values: Values): FieldSpec[] {
  return fields.filter((field) => !field.when || field.when(values));
}

export const REQUIRED_MESSAGE = "Preencha para continuar.";
export const CHOICE_MESSAGE = "Escolha uma opção para continuar.";

/** Mensagem de erro do campo, ou null se pode avançar. */
export function validateField(field: FieldSpec, values: Values): string | null {
  const value = values[field.key];
  if (isBlank(value)) {
    if (field.optional) return null;
    return field.kind === "choice" ? CHOICE_MESSAGE : REQUIRED_MESSAGE;
  }
  if (typeof value === "string" && field.maxLength && value.length > field.maxLength) {
    return `No máximo ${field.maxLength} caracteres.`;
  }
  return field.validate?.(value, values) ?? null;
}

/** Remove das respostas as dos campos que deixaram de ser visíveis (ex.: término quando passou a ser "emprego atual"). */
export function pruneHidden(fields: FieldSpec[], values: Values): Values {
  const visible = new Set(visibleFields(fields, values).map((field) => field.key));
  return Object.fromEntries(Object.entries(values).filter(([key]) => visible.has(key) || !fields.some((field) => field.key === key)));
}

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(count - 1, 0)));
}
