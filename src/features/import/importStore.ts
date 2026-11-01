import type { CurriculumImport } from "@/api/dto";

// O rascunho é grande demais para ir como parâmetro de rota e não deve ser guardado em disco (tem dados pessoais):
// fica só em memória, entre a tela de envio e a de revisão.
let current: CurriculumImport.Draft | null = null;

export const importStore = {
  set: (draft: CurriculumImport.Draft) => {
    current = draft;
  },
  get: (): CurriculumImport.Draft | null => current,
  clear: () => {
    current = null;
  },
};
