import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/account";
import type { NotificationList } from "@/api/dto";
import { SwipeToRead } from "@/gestures/SwipeToRead";
import { linkToRoute } from "@/features/notifications/linkToRoute";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { SkeletonCard } from "@/ui/Skeleton";
import { EmptyState, ErrorState } from "@/ui/States";
import { Text } from "@/ui/Text";
import { colors, MIN_TOUCH, space } from "@/ui/tokens";
import { t } from "@/i18n/pt-BR";

type Cache = NotificationList.Response;

/** Central de notificações: arrastar o item para a esquerda marca como lida; tocar abre o destino (plano, 7.7). */
export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications(30) });

  const patch = (update: (current: Cache) => Cache) => queryClient.setQueryData<Cache>(["notifications"], (current) => (current ? update(current) : current));

  const markRead = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<Cache>(["notifications"]);
      patch((current) => ({ unread_count: Math.max(0, current.unread_count - (current.records.find((item) => item.id === id && !item.read) ? 1 : 0)), records: current.records.map((item) => (item.id === id ? { ...item, read: true } : item)) }));
      return { previous };
    },
    onError: (_error, _id, context) => context?.previous && queryClient.setQueryData(["notifications"], context.previous),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => patch((current) => ({ unread_count: 0, records: current.records.map((item) => ({ ...item, read: true })) })),
  });

  const open = (item: NotificationList.Item) => {
    if (!item.read) markRead.mutate(item.id);
    const route = linkToRoute(item.link);
    if (route) router.push(route as never);
  };

  const records = query.data?.records ?? [];
  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Button label="← Voltar" variant="ghost" onPress={() => router.back()} />
        <Text variant="title" accessibilityRole="header" style={styles.title}>{t.notifications.title}</Text>
      </View>
      {records.some((item) => !item.read) ? <Button label={t.notifications.markAll} variant="secondary" onPress={() => markAll.mutate()} loading={markAll.isPending} /> : null}
      {query.isPending ? <SkeletonCard /> : null}
      {query.isError ? <ErrorState message={t.notifications.loadError} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && records.length === 0 ? <EmptyState title={t.notifications.emptyTitle} message={t.notifications.emptyMessage} /> : null}
      <FlashList
        data={records}
        keyExtractor={(item) => String(item.id)}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        renderItem={({ item }) => (
          <SwipeToRead label={t.notifications.markRead} disabled={item.read} onTrigger={() => markRead.mutate(item.id)} accessibilityLabel={`${item.read ? "" : "Não lida. "}${item.title}. ${item.body ?? ""}`}>
            <Pressable accessibilityRole="button" onPress={() => open(item)} style={[styles.row, !item.read ? styles.unread : null]}>
              <Text variant="bodyStrong">{item.title}</Text>
              {item.body ? <Text tone="textMuted">{item.body}</Text> : null}
              <Text variant="caption" tone="textFaint">{formatDateTime(item.created_at)}</Text>
            </Pressable>
          </SwipeToRead>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: space[2] },
  title: { flex: 1 },
  row: { minHeight: MIN_TOUCH, padding: space[4], gap: space[1], borderBottomWidth: 1, borderBottomColor: colors.border },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.brand, backgroundColor: colors.brandSoft },
});
