import { type ReactNode } from "react";
import { StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { haptics } from "@/lib/haptics";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";
import { SWIPE } from "./config";
import { crossedSwipeThreshold, decideSwipe } from "./decide";

type Props = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  /** Rótulos que aparecem conforme o arrasto ("QUERO" / "AGORA NÃO") e viram ações de acessibilidade. */
  rightLabel?: string;
  leftLabel?: string;
  /** Abre o detalhe (toque no card). */
  onOpen?: () => void;
  openLabel?: string;
  disabled?: boolean;
  /** Descrição lida pelo leitor de tela. */
  accessibilityLabel?: string;
};

const RIGHT_ACTION = "swipeRight";
const LEFT_ACTION = "swipeLeft";
const OPEN_ACTION = "activate";

/**
 * Card arrastável horizontalmente (plano, 9.3). Gesto é atalho, nunca a única porta: o mesmo efeito está
 * disponível como ação de acessibilidade e os botões equivalentes ficam na tela que usa o card.
 */
export function SwipeCard({ children, onSwipeRight, onSwipeLeft, rightLabel, leftLabel, onOpen, openLabel = "Abrir detalhes", disabled, accessibilityLabel }: Props) {
  const reduced = useReduceMotion();
  const width = useSharedValue(360);
  const translateX = useSharedValue(0);
  const crossed = useSharedValue(false);

  const finish = (direction: "left" | "right") => {
    const handler = direction === "right" ? onSwipeRight : onSwipeLeft;
    handler?.();
  };

  const pan = usePanGesture({
    enabled: !disabled,
    activeOffsetX: [-SWIPE.activeOffsetX, SWIPE.activeOffsetX],
    failOffsetY: [-SWIPE.failOffsetY, SWIPE.failOffsetY],
    onUpdate: (event) => {
      "worklet";
      translateX.value = event.translationX;
    },
    onDeactivate: (event) => {
      "worklet";
      const direction = decideSwipe(event.translationX, event.velocityX, width.value);
      if (!direction || (direction === "right" && !onSwipeRight) || (direction === "left" && !onSwipeLeft)) {
        translateX.value = withTiming(0, { duration: SWIPE.returnMs });
        return;
      }
      const target = (direction === "right" ? 1 : -1) * width.value * 1.3;
      if (reduced) {
        translateX.value = target;
        scheduleOnRN(finish, direction);
      } else {
        translateX.value = withTiming(target, { duration: SWIPE.exitMs }, (completed) => {
          "worklet";
          if (completed) scheduleOnRN(finish, direction);
        });
      }
    },
  });

  // Tique háptico ao cruzar o limiar, em qualquer direção.
  useAnimatedReaction(
    () => crossedSwipeThreshold(translateX.value, width.value),
    (now, before) => {
      if (now !== before) {
        crossed.value = now;
        if (now) scheduleOnRN(haptics.tick);
      }
    },
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: reduced ? "0deg" : `${interpolate(translateX.value, [-width.value, 0, width.value], [-SWIPE.maxRotationDeg, 0, SWIPE.maxRotationDeg], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const rightOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, width.value * SWIPE.thresholdRatio], [0, 1], Extrapolation.CLAMP) }));
  const leftOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [-width.value * SWIPE.thresholdRatio, 0], [1, 0], Extrapolation.CLAMP) }));

  const actions = [
    ...(onOpen ? [{ name: OPEN_ACTION, label: openLabel }] : []),
    ...(onSwipeRight && rightLabel ? [{ name: RIGHT_ACTION, label: rightLabel }] : []),
    ...(onSwipeLeft && leftLabel ? [{ name: LEFT_ACTION, label: leftLabel }] : []),
  ];

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const name = event.nativeEvent.actionName;
    if (name === OPEN_ACTION) onOpen?.();
    else if (name === RIGHT_ACTION) onSwipeRight?.();
    else if (name === LEFT_ACTION) onSwipeLeft?.();
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={actions}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={(event: LayoutChangeEvent) => {
          width.set(event.nativeEvent.layout.width);
        }}
        style={cardStyle}
      >
        {children}
        {rightLabel ? (
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampRight, rightOpacity]}>
            <Text variant="label" tone="success">{rightLabel}</Text>
          </Animated.View>
        ) : null}
        {leftLabel ? (
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampLeft, leftOpacity]}>
            <Text variant="label" tone="error">{leftLabel}</Text>
          </Animated.View>
        ) : null}
        <View pointerEvents="none" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stamp: { position: "absolute", top: space[4], paddingHorizontal: space[3], paddingVertical: space[1], borderWidth: 2, backgroundColor: colors.canvas },
  stampRight: { left: space[4], borderColor: colors.success },
  stampLeft: { right: space[4], borderColor: colors.error },
});
