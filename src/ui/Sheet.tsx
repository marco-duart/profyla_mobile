import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, GestureHandlerRootView, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { Button } from "./Button";
import { Text } from "./Text";
import { colors, radii, space } from "./tokens";
import { t } from "@/i18n/pt-BR";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  /** Texto do botão de fechar (sempre visível: arrastar para baixo é só um atalho). */
  closeLabel?: string;
};

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

/** Bottom sheet arrastável. Arrastar para baixo fecha sem salvar; o botão t.common.close é o equivalente tocável. */
export function Sheet({ visible, onClose, title, children, closeLabel = t.common.close }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReduceMotion();
  const offset = useSharedValue(height);

  useEffect(() => {
    if (visible) offset.value = reduced ? 0 : withTiming(0, { duration: 220 });
    else offset.value = height;
  }, [visible, height, offset, reduced]);

  const pan = usePanGesture({
    activeOffsetY: [-12, 12],
    failOffsetX: [-20, 20],
    onUpdate: (event) => {
      "worklet";
      offset.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      "worklet";
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        offset.set(withTiming(0, { duration: 160 }));
      }
    },
  });

  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Pressable accessibilityLabel={closeLabel} accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }, animated]}
          >
            <View style={styles.handle} />
            {title ? <Text variant="heading" style={styles.title} accessibilityRole="header">{title}</Text> : null}
            <View style={styles.body}>{children}</View>
            <Button label={closeLabel} variant="ghost" onPress={onClose} />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.canvasAlt,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: space[5],
    paddingTop: space[3],
    gap: space[3],
    maxHeight: "90%",
  },
  handle: { alignSelf: "center", width: 40, height: 4, backgroundColor: colors.borderStrong },
  title: { marginTop: space[2] },
  body: { gap: space[3] },
});
