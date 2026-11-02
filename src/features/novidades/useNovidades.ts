import { useQuery } from "@tanstack/react-query";
import { colors } from "@/ui/tokens";
import { openNovidadeUrl, type NovidadesPalette } from "./NovidadesNative";
import { NOVIDADES_STALE_TIME_MS, type Novidade } from "./novidades";
import { novidadesService, type NovidadesPlacement } from "./service";

export function useNovidades(placement: NovidadesPlacement) {
  const query = useQuery({
    queryKey: ["novidades", placement],
    queryFn: () => novidadesService.list(placement),
    staleTime: NOVIDADES_STALE_TIME_MS,
  });

  return {
    ...query,
    onImpression: (novidade: Novidade) => novidadesService.impression(novidade.id, placement),
    onCtaPress: (novidade: Novidade, url: string) => {
      novidadesService.click(novidade.id, placement);
      void openNovidadeUrl(url);
    },
  };
}

/** Cores do tema do Profyla para os cards (o componente é o mesmo dos outros apps). */
export const novidadesPalette: NovidadesPalette = {
  surface: colors.surface,
  border: colors.border,
  text: colors.text,
  textMuted: colors.textMuted,
  primary: colors.brand,
  onPrimary: colors.text,
  badgeBackground: colors.brandSoft,
  badgeText: colors.tint,
};
