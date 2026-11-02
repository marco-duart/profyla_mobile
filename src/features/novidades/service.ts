import { listNovidades, sendNovidadeEvents } from "@/api/novidades";
import { createMobileNovidadesTracker } from "./NovidadesNative";
import { novidadesFrom, type Novidade } from "./novidades";

// Placements do sistema "profyla" no Painel de Controle (db/seeds/001_catalog.sql do painel).
export type NovidadesPlacement = "mobile.home" | "mobile.novidades";

let tracker: ReturnType<typeof createMobileNovidadesTracker> | null = null;
/** Criado na primeira necessidade: ele liga um relógio de 30 s e um ouvinte de segundo plano. */
const trackerInstance = () => (tracker ??= createMobileNovidadesTracker(sendNovidadeEvents));

export const novidadesService = {
  /** Erro, sem rede ou painel fora = lista vazia: Novidades nunca mostra erro. */
  list: (placement: NovidadesPlacement): Promise<Novidade[]> =>
    listNovidades(placement)
      .then(novidadesFrom)
      .catch(() => []),

  impression: (announcementId: string, placement: NovidadesPlacement) => {
    trackerInstance().impression(announcementId, placement);
  },

  click: (announcementId: string, placement: NovidadesPlacement) => {
    trackerInstance().click(announcementId, placement);
  },
};
