import { type ComponentRef, type Ref, useId } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Text } from "./Text";
import { colors, fontSizes, fonts, MAX_FONT_SCALE, MIN_TOUCH, radii, space } from "./tokens";

export type TextFieldHandle = ComponentRef<typeof TextInput>;

type Props = Omit<TextInputProps, "onChangeText" | "ref"> & {
  ref?: Ref<TextFieldHandle>;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  hint?: string;
  /** Máscara aplicada a cada alteração (ex.: maskPhone). */
  format?: (value: string) => string;
};

export function TextField({ label, value, onChangeText, error, hint, format, style, multiline, ref, ...rest }: Props) {
  const noteId = useId();
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="textMuted">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: rest.editable === false }}
        aria-invalid={error ? true : undefined}
        aria-describedby={noteId}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.brand}
        multiline={multiline}
        value={value}
        onChangeText={(next) => onChangeText(format ? format(next) : next)}
        {...rest}
        style={[styles.input, multiline ? styles.multiline : null, error ? { borderColor: colors.error } : null, style]}
      />
      {error ? <Text nativeID={noteId} variant="caption" tone="error" accessibilityLiveRegion="polite">{error}</Text> : hint ? <Text nativeID={noteId} variant="caption" tone="textMuted">{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  input: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
});
