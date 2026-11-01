import { StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { colors, space } from "./tokens";

type Props = { current: number; total: number; label?: string };

/** Barra de progresso dos passos (onboarding, formulários, testes). */
export function Progress({ current, total, label }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(total, 1)) * 100)));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? `Passo ${current} de ${total}`}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={styles.wrap}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text variant="caption" tone="textMuted">{label ?? `Passo ${current} de ${total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  track: { height: 4, backgroundColor: colors.surfaceStrong },
  fill: { height: 4, backgroundColor: colors.brand },
});
