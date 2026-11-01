import { BlurView } from "expo-blur";
import { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, space } from "./tokens";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Padding interno padrão (space[4]). */
  padded?: boolean;
  strong?: boolean;
  /** Desliga o blur (listas longas, aparelhos lentos). O fundo translúcido continua. */
  flat?: boolean;
};

// Glass só em elementos de topo. No Android o blur custa caro: lá o padrão é o fundo translúcido sólido.
const BLUR_ENABLED = Platform.OS === "ios";

export function Surface({ children, style, padded = true, strong, flat }: Props) {
  const background = strong ? colors.surfaceStrong : colors.surface;
  const useBlur = BLUR_ENABLED && !flat;
  return (
    <View style={[styles.base, { backgroundColor: useBlur ? "transparent" : colors.canvasAlt }, style]}>
      {useBlur ? <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: background }]} pointerEvents="none" />
      <View style={padded ? styles.padded : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, overflow: "hidden" },
  padded: { padding: space[4], gap: space[2] },
});
