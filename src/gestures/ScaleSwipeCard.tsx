import { useState, type ReactNode } from "react";
import { StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { haptics } from "@/lib/haptics";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";
import { SCALE, SWIPE } from "./config";
import { SCALE_LABELS, SCALE_ORDER, scaleAnswerAt, type ScaleAnswer } from "./decide";

type Props = {
  children: ReactNode;
  onAnswer: (answer: ScaleAnswer) => void;
  accessibilityLabel?: string;
};

/**
 * Card das afirmações dos testes comportamentais: dois limiares por lado (parcial e total) e arrasto para cima
 * (neutro), com um tique háptico a cada limiar. Os cinco botões da escala ficam na tela (ScaleButtons) e são o
 * caminho principal para leitor de tela; aqui também há uma ação de acessibilidade por resposta.
 */
export function ScaleSwipeCard({ children, onAnswer, accessibilityLabel }: Props) {
  const reduced = useReduceMotion();
  const size = useSharedValue({ width: 360, height: 220 });
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [preview, setPreview] = useState<ScaleAnswer | null>(null);

  const finish = (answer: ScaleAnswer) => onAnswer(answer);

  const pan = usePanGesture({
    activeOffsetX: [-SWIPE.activeOffsetX, SWIPE.activeOffsetX],
    activeOffsetY: [-SWIPE.activeOffsetX, SWIPE.activeOffsetX],
    onUpdate: (event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = Math.min(0, event.translationY);
    },
    onDeactivate: (event) => {
      "worklet";
      const answer = scaleAnswerAt(event.translationX, Math.min(0, event.translationY), size.value.width, size.value.height);
      if (!answer) {
        translateX.value = withTiming(0, { duration: SWIPE.returnMs });
        translateY.value = withTiming(0, { duration: SWIPE.returnMs });
        return;
      }
      if (reduced) {
        scheduleOnRN(finish, answer);
        translateX.value = 0;
        translateY.value = 0;
        return;
      }
      const outX = answer === "N" ? 0 : (answer === "CT" || answer === "CP" ? 1 : -1) * size.value.width * 1.2;
      const outY = answer === "N" ? -size.value.height * 1.2 : 0;
      translateX.value = withTiming(outX, { duration: SCALE.exitMs });
      translateY.value = withTiming(outY, { duration: SCALE.exitMs }, (completed) => {
        "worklet";
        if (completed) {
          scheduleOnRN(finish, answer);
          translateX.value = 0;
          translateY.value = 0;
        }
      });
    },
  });

  // Pré-visualização da resposta atual + tique a cada mudança de nível.
  useAnimatedReaction(
    () => scaleAnswerAt(translateX.value, translateY.value, size.value.width, size.value.height),
    (now, before) => {
      if (now !== before) {
        scheduleOnRN(setPreview, now);
        if (now) scheduleOnRN(haptics.tick);
      }
    },
  );

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }] }));

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const answer = event.nativeEvent.actionName as ScaleAnswer;
    if (SCALE_ORDER.includes(answer)) onAnswer(answer);
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={SCALE_ORDER.map((answer) => ({ name: answer, label: SCALE_LABELS[answer] }))}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={(event: LayoutChangeEvent) => {
          size.set({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
        }}
        style={cardStyle}
      >
        {children}
        <View pointerEvents="none" style={styles.previewHost}>
          {preview ? (
            <View style={styles.preview}>
              <Text variant="label" tone={preview === "CT" || preview === "CP" ? "success" : preview === "N" ? "textMuted" : "error"}>{SCALE_LABELS[preview]}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  previewHost: { position: "absolute", top: space[3], left: 0, right: 0, alignItems: "center" },
  preview: { paddingHorizontal: space[3], paddingVertical: space[1], borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.canvas },
});
