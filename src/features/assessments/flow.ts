import type { ScaleAnswer } from "@/gestures/decide";

export type Answers = Record<string, ScaleAnswer>;
export type Draft = { order: string[]; answers: Answers; index: number };

/** Ordem embaralhada das perguntas, guardada no rascunho para não mudar se o app for fechado no meio. */
export function shuffledOrder(ids: string[], random: () => number = Math.random): string[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Retoma um rascunho só se ele ainda corresponde às perguntas atuais (a prova pode ter mudado de versão). */
export function restoreDraft(saved: Draft | null, ids: string[]): Draft | null {
  if (!saved) return null;
  const known = new Set(ids);
  if (saved.order.length !== ids.length || !saved.order.every((id) => known.has(id))) return null;
  const answers = Object.fromEntries(Object.entries(saved.answers).filter(([id]) => known.has(id))) as Answers;
  return { order: saved.order, answers, index: Math.max(0, Math.min(saved.index, ids.length)) };
}

/** Responde a pergunta atual e avança. Tanto o arrasto quanto os cinco botões chamam esta mesma função. */
export function answerCurrent(draft: Draft, answer: ScaleAnswer): Draft {
  const id = draft.order[draft.index];
  if (id === undefined) return draft;
  return { ...draft, answers: { ...draft.answers, [id]: answer }, index: draft.index + 1 };
}

export function goBack(draft: Draft): Draft {
  return { ...draft, index: Math.max(0, draft.index - 1) };
}

export const isComplete = (draft: Draft): boolean => draft.order.every((id) => draft.answers[id] !== undefined);

export const progressOf = (draft: Draft): { current: number; total: number } => ({ current: Math.min(draft.index + 1, draft.order.length), total: draft.order.length });
