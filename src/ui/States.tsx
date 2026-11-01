import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";
import { colors, space } from "./tokens";
import { t } from "@/i18n/pt-BR";

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text variant="heading" center>{title}</Text>
      {message ? <Text tone="textMuted" center>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text variant="heading" center>{t.states.errorTitle}</Text>
      <Text tone="textMuted" center>{message}</Text>
      {onRetry ? <Button label={t.common.retry} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, space[1]) }]} accessibilityRole="alert" accessibilityLiveRegion="polite" pointerEvents="none">
      <Text variant="caption" tone="warning" center>{t.states.offline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: space[3], padding: space[6] },
  banner: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: colors.canvasAlt, borderBottomWidth: 1, borderBottomColor: colors.warning, paddingBottom: space[1], paddingHorizontal: space[4], zIndex: 10 },
});
