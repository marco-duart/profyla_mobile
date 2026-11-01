import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { colors, space } from "./tokens";

export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: DimensionValue }) {
  const reduced = useReduceMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = reduced ? 0.6 : withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={[{ height, width, backgroundColor: colors.surfaceStrong }, animated]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={14} />
      <Skeleton height={14} width="80%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[3], padding: space[4], borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
