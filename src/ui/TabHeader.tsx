import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { Text } from "./Text";
import { space } from "./tokens";

/** Título da aba + (ação opcional) + sino de notificações sempre à direita. */
export function TabHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>{title}</Text>
      {action}
      <NotificationBell />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: space[2] }, title: { flex: 1 } });
