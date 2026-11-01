import { Pressable, StyleSheet } from "react-native";
import { haptics } from "@/lib/haptics";
import { Text } from "./Text";
import { colors, MIN_TOUCH, radii, space } from "./tokens";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function Chip({ label, selected = false, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      style={[
        styles.base,
        selected ? { backgroundColor: colors.brandSoft, borderColor: colors.brand } : { borderColor: colors.border },
      ]}
    >
      <Text variant="bodyStrong" tone={selected ? "text" : "textMuted"}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space[4],
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
});
