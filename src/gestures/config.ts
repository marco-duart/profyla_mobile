// Limiares, durações e padrões dos gestos num só lugar: nenhum número solto nas telas (plano, 9.3).
export const SWIPE = {
  /** Fração da largura do card que decide o gesto. */
  thresholdRatio: 0.3,
  /** Velocidade (px/s) que decide o gesto mesmo antes do limiar. */
  velocity: 800,
  exitMs: 220,
  returnMs: 160,
  maxRotationDeg: 10,
  /** Movimento horizontal mínimo para o gesto ativar (evita conflito com rolagem e com a borda do sistema). */
  activeOffsetX: 14,
  /** Movimento vertical que cancela o gesto (o usuário está rolando). */
  failOffsetY: 24,
} as const;

export const SCALE = {
  /** Frações da largura: primeiro limiar (parcial) e segundo limiar (total). */
  partialRatio: 0.18,
  fullRatio: 0.42,
  /** Fração da altura do card para o arrasto para cima (neutro). */
  upRatio: 0.16,
  exitMs: 200,
} as const;

export const ROW_SWIPE = {
  revealRatio: 0.4,
  triggerRatio: 0.35,
  exitMs: 180,
} as const;

/** Tempo para desfazer uma ação reversível antes de ela ir ao servidor. */
export const UNDO_MS = 5000;

/** Quantas vezes a dica animada do gesto é mostrada no feed. */
export const HINT_MAX_VIEWS = 3;
