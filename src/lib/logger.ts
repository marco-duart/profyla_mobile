// Nenhum dado pessoal vai para o console em produção: no build de release os logs viram no-op.
const enabled = __DEV__;

export const logger = {
  debug: (...args: unknown[]) => {
    if (enabled) console.log("[profyla]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (enabled) console.warn("[profyla]", ...args);
  },
  error: (...args: unknown[]) => {
    if (enabled) console.error("[profyla]", ...args);
  },
};
