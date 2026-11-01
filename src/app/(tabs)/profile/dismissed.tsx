import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useDismissedJobs } from "@/features/jobs/useDismissedJobs";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { EmptyState } from "@/ui/States";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { space } from "@/ui/tokens";
import { t } from "@/i18n/pt-BR";

/** Vagas que a pessoa dispensou no feed. Ficam só no aparelho; restaurar devolve a vaga ao feed (D-M05). */
export default function Dismissed() {
  const router = useRouter();
  const { dismissed, ready, restore } = useDismissedJobs();
  return (
    <Screen footer={<Button label={t.common.back} variant="secondary" onPress={() => router.back()} fullWidth />}>
      <Text variant="title" accessibilityRole="header">{t.dismissed.title}</Text>
      {ready && dismissed.length === 0 ? <EmptyState title={t.dismissed.emptyTitle} message={t.dismissed.emptyMessage} /> : null}
      {dismissed.map((job) => (
        <Surface key={job.id}>
          <View style={styles.row}>
            <View style={styles.grow}>
              <Text variant="bodyStrong">{job.title}</Text>
              <Text tone="textMuted">{job.company}</Text>
            </View>
            <Button label={t.dismissed.restore} variant="secondary" accessibilityLabel={`Restaurar a vaga ${job.title}`} onPress={() => restore(job.id)} />
          </View>
        </Surface>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: space[3] }, grow: { flex: 1 } });
