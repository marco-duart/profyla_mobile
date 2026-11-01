import { useRouter } from "expo-router";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import type { PendingTask } from "@/features/applications/pending";
import { usePendingTasks } from "@/features/applications/usePendingTasks";
import { StatusBadge } from "@/features/applications/ui";
import { formatDate } from "@/lib/format";
import { Screen } from "@/ui/Screen";
import { SkeletonCard } from "@/ui/Skeleton";
import { EmptyState, ErrorState } from "@/ui/States";
import { Surface } from "@/ui/Surface";
import { TabHeader } from "@/ui/TabHeader";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

/** "O que falta" no topo (cada item leva direto à ação) e, abaixo, as candidaturas (plano, 7.5). */
export default function Applications() {
  const router = useRouter();
  const { tasks, list, refetch } = usePendingTasks();

  const goTo = (task: PendingTask) => {
    const id = String(task.applicationId);
    if (task.kind === "exam") router.push({ pathname: "/applications/[id]/exam", params: { id } });
    else if (task.kind === "form") router.push({ pathname: "/applications/[id]/form", params: { id } });
    else router.push({ pathname: "/applications/[id]/interview", params: { id, interviewId: String(task.interviewId ?? "") } });
  };

  return (
    <Screen insideTabs refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void refetch()} tintColor="#fff" />}>
      <TabHeader title="Candidaturas" />

      {tasks.length > 0 ? (
        <View style={styles.section} accessibilityRole="list">
          <Text variant="heading">O que falta</Text>
          {tasks.map((task) => (
            <Pressable key={task.key} accessibilityRole="button" accessibilityLabel={`${task.title}. ${task.subtitle}`} onPress={() => goTo(task)} style={styles.task}>
              <Text variant="bodyStrong">{task.title}</Text>
              <Text tone="textMuted">{task.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="heading">Suas candidaturas</Text>
        {list.isPending ? <SkeletonCard /> : null}
        {list.isError ? <ErrorState message="Não foi possível carregar suas candidaturas." onRetry={() => void list.refetch()} /> : null}
        {list.isSuccess && list.data.length === 0 ? (
          <EmptyState title="Você ainda não se candidatou" message="Passe pelas vagas e arraste para a direita nas que gostar." actionLabel="Ver vagas" onAction={() => router.push("/(tabs)/jobs")} />
        ) : null}
        {list.data?.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.job_name}, ${item.company_name}, etapa ${item.stage}`} onPress={() => router.push({ pathname: "/applications/[id]", params: { id: String(item.id) } })}>
            <Surface>
              <Text variant="heading">{item.job_name}</Text>
              <Text tone="textMuted">{item.company_name}{item.job_location ? ` · ${item.job_location}` : ""}</Text>
              <StatusBadge label={item.stage} tone={item.status_tone} />
              {item.created_at ? <Text variant="caption" tone="textFaint">Candidatura de {formatDate(item.created_at)}</Text> : null}
            </Surface>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
  task: { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: space[4], gap: space[1], minHeight: 56 },
});
