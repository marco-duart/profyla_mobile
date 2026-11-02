import { useRouter } from "expo-router";
import { View } from "react-native";
import { space } from "@/ui/tokens";
import { NovidadesCarousel } from "./NovidadesNative";
import { novidadesPalette, useNovidades } from "./useNovidades";

/** Carrossel compacto da aba Vagas (placement mobile.home). Sem novidade não renderiza nada, nem título nem espaço. */
export function NovidadesHome() {
  const router = useRouter();
  const novidades = useNovidades("mobile.home");
  if (!novidades.data || novidades.data.length === 0) return null;

  // A tela já tem recuo lateral (space[5]); o carrossel rola de ponta a ponta e devolve o recuo por dentro.
  return (
    <View style={{ marginHorizontal: -space[5] }}>
      <NovidadesCarousel
        items={novidades.data}
        palette={novidadesPalette}
        onImpression={novidades.onImpression}
        onCtaPress={novidades.onCtaPress}
        onSeeAll={() => router.push("/novidades")}
        inset={space[5]}
        compact
      />
    </View>
  );
}
