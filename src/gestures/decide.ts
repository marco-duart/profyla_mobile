import { SCALE, SWIPE } from "./config";

// Funções puras (e "worklet": rodam na thread de UI durante o gesto) que decidem o resultado de um arrasto.
// Ficam separadas dos componentes para serem testadas por unidade.

export type SwipeDirection = "left" | "right";

export function decideSwipe(translationX: number, velocityX: number, width: number): SwipeDirection | null {
  "worklet";
  const distance = width * SWIPE.thresholdRatio;
  if (translationX > distance || (velocityX > SWIPE.velocity && translationX > 0)) return "right";
  if (translationX < -distance || (velocityX < -SWIPE.velocity && translationX < 0)) return "left";
  return null;
}

/** O limiar já foi cruzado (usado para o tique háptico durante o arrasto). */
export function crossedSwipeThreshold(translationX: number, width: number): boolean {
  "worklet";
  return Math.abs(translationX) > width * SWIPE.thresholdRatio;
}

/** Escala de 5 respostas dos testes comportamentais (DISC): CT, CP, N, DP, DT. */
export type ScaleAnswer = "CT" | "CP" | "N" | "DP" | "DT";

/**
 * Resposta correspondente à posição atual do arrasto, ou null se ainda está parado no meio.
 * direita parcial = CP, direita total = CT; esquerda parcial = DP, esquerda total = DT; para cima = neutro.
 */
export function scaleAnswerAt(translationX: number, translationY: number, width: number, height: number): ScaleAnswer | null {
  "worklet";
  const horizontal = Math.abs(translationX);
  const up = -translationY;
  if (up > height * SCALE.upRatio && up > horizontal) return "N";
  if (horizontal > width * SCALE.fullRatio) return translationX > 0 ? "CT" : "DT";
  if (horizontal > width * SCALE.partialRatio) return translationX > 0 ? "CP" : "DP";
  return null;
}

export const SCALE_LABELS: Record<ScaleAnswer, string> = {
  CT: "Concordo totalmente",
  CP: "Concordo parcialmente",
  N: "Neutro",
  DP: "Discordo parcialmente",
  DT: "Discordo totalmente",
};

/** Ordem de exibição dos cinco botões (da discordância total à concordância total). */
export const SCALE_ORDER: ScaleAnswer[] = ["DT", "DP", "N", "CP", "CT"];
