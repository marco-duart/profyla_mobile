import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

/** Dica animada do arrasto (primeiros cards do feed). Com "Reduzir movimento", vira só o texto. */
export function GestureHint({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }) {
  const reduced = useReduceMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    x.value = withRepeat(withSequence(withTiming(28, { duration: 600 }), withTiming(-28, { duration: 1200 }), withTiming(0, { duration: 600 })), -1);
  }, [reduced, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={styles.wrap} accessibilityLabel={`Dica: arraste para a direita para ${rightLabel} ou para a esquerda para ${leftLabel}.`} accessible>
      <View style={styles.row}>
        <Text variant="caption" tone="error">← {leftLabel}</Text>
        <Animated.View style={[styles.dot, style]} />
        <Text variant="caption" tone="success">{rightLabel} →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: space[2] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand },
});
