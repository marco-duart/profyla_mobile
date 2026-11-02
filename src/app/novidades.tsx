import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { NovidadesList } from "@/features/novidades/NovidadesNative";
import { novidadesPalette, useNovidades } from "@/features/novidades/useNovidades";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { space } from "@/ui/tokens";
import { t } from "@/i18n/pt-BR";

/** Tela completa de Novidades da Maaxis (placement mobile.novidades). */
export default function NovidadesScreen() {
  const router = useRouter();
  const novidades = useNovidades("mobile.novidades");

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Button label={t.common.back} variant="ghost" onPress={() => router.back()} />
        <Text variant="title" accessibilityRole="header" style={styles.title}>{t.novidades.title}</Text>
      </View>
      <NovidadesList
        items={novidades.data}
        loading={novidades.isPending}
        refreshing={novidades.isRefetching}
        onRefresh={() => void novidades.refetch()}
        palette={novidadesPalette}
        onImpression={novidades.onImpression}
        onCtaPress={novidades.onCtaPress}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: space[2], paddingHorizontal: space[5], paddingTop: space[4] },
  title: { flex: 1 },
});
