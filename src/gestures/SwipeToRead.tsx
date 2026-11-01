import { type ReactNode } from "react";
import { StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";
import { ROW_SWIPE, SWIPE } from "./config";

type Props = {
  children: ReactNode;
  onTrigger: () => void;
  /** Ação revelada à direita ("Marcar como lida"). */
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const ACTION = "trigger";

/** Linha de lista com uma ação revelada ao arrastar para a esquerda (notificações: marcar como lida). */
export function SwipeToRead({ children, onTrigger, label, disabled, accessibilityLabel }: Props) {
  const reduced = useReduceMotion();
  const width = useSharedValue(360);
  const translateX = useSharedValue(0);

  const pan = usePanGesture({
    enabled: !disabled,
    activeOffsetX: [-SWIPE.activeOffsetX, SWIPE.activeOffsetX],
    failOffsetY: [-SWIPE.failOffsetY, SWIPE.failOffsetY],
    onUpdate: (event) => {
      "worklet";
      translateX.value = Math.min(0, Math.max(-width.value * ROW_SWIPE.revealRatio, event.translationX));
    },
    onDeactivate: () => {
      "worklet";
      if (translateX.value < -width.value * ROW_SWIPE.triggerRatio * 0.9) {
        translateX.value = reduced ? 0 : withTiming(0, { duration: ROW_SWIPE.exitMs });
        scheduleOnRN(onTrigger);
      } else {
        translateX.value = withTiming(0, { duration: SWIPE.returnMs });
      }
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        width.value = event.nativeEvent.layout.width;
      }}
    >
      <View style={styles.action} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text variant="label" tone="success">{label}</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityActions={[{ name: ACTION, label }]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === ACTION) onTrigger();
          }}
          style={[styles.row, rowStyle]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.canvas },
  action: { ...StyleSheet.absoluteFill, alignItems: "flex-end", justifyContent: "center", paddingRight: space[4], backgroundColor: colors.successSubtle },
});
