import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { listNotifications } from "@/api/account";
import { Text } from "@/ui/Text";
import { colors, MIN_TOUCH } from "@/ui/tokens";

/** Sino com o contador de não lidas. Atualiza ao voltar para o app e a cada 60 s com o app aberto. */
export function NotificationBell() {
  const router = useRouter();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications(30), refetchInterval: 60_000 });
  const unread = notifications.data?.unread_count ?? 0;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={unread ? `Notificações, ${unread} não lidas` : "Notificações"} onPress={() => router.push("/notifications")} style={styles.button}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text variant="caption" style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, right: 4, minWidth: 18, height: 18, paddingHorizontal: 4, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.text, fontSize: 11, lineHeight: 14 },
});
