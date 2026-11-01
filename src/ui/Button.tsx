import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { haptics } from "@/lib/haptics";
import { Text } from "./Text";
import { colors, MIN_TOUCH, radii, space } from "./tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palette: Record<Variant, { bg: string; border: string; text: "text" | "error" | "tint" }> = {
  primary: { bg: colors.brand, border: colors.brand, text: "text" },
  secondary: { bg: colors.surfaceStrong, border: colors.borderStrong, text: "text" },
  ghost: { bg: "transparent", border: "transparent", text: "tint" },
  danger: { bg: colors.errorSubtle, border: colors.error, text: "error" },
};

export function Button({ label, variant = "primary", loading, fullWidth, disabled, onPress, style, ...rest }: Props) {
  const blocked = disabled || loading;
  const colorSet = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(blocked), busy: Boolean(loading) }}
      disabled={blocked}
      onPress={(event) => {
        haptics.select();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colorSet.bg, borderColor: colorSet.border, opacity: blocked ? 0.5 : pressed ? 0.85 : 1 },
        fullWidth ? styles.full : null,
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : <Text variant="bodyStrong" tone={colorSet.text} center>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  full: { alignSelf: "stretch" },
});
