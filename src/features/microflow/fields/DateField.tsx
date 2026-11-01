import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { formatDate, parseIsoDate, toIsoDate } from "@/lib/format";
import { onlyDigits } from "@/lib/masks";
import { Button } from "@/ui/Button";
import { Sheet } from "@/ui/Sheet";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { space } from "@/ui/tokens";

type Props = {
  label: string;
  /** "YYYY-MM-DD" ou vazio. */
  value: string | null;
  onChange: (iso: string | null) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string | null;
};

/** "dd/mm/aaaa" -> "YYYY-MM-DD" (ou null se incompleta/impossível). */
export function parseTypedDate(text: string): string | null {
  const digits = onlyDigits(text);
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return toIsoDate(date);
}

export function maskDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

/** Seletor nativo de data (Android: diálogo; iOS: sheet com rolagem). Na web de desenvolvimento, campo com máscara. */
export function DateField({ label, value, onChange, maximumDate, minimumDate, error }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [typed, setTyped] = useState(value ? formatDate(value, "") : "");
  const current = parseIsoDate(value) ?? maximumDate ?? new Date();

  if (Platform.OS === "web") {
    return (
      <TextField
        label={label}
        value={typed}
        onChangeText={(text) => {
          setTyped(text);
          onChange(parseTypedDate(text));
        }}
        format={maskDate}
        keyboardType="number-pad"
        placeholder="dd/mm/aaaa"
        error={error}
        autoFocus
      />
    );
  }

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: current, mode: "date", maximumDate, minimumDate, onValueChange: (_event, date) => onChange(toIsoDate(date)) });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="textMuted">{label}</Text>
      <Button label={value ? formatDate(value) : "Escolher data"} variant="secondary" onPress={open} accessibilityHint="Abre o seletor de data" />
      {error ? <Text variant="caption" tone="error" accessibilityRole="alert">{error}</Text> : null}
      {Platform.OS === "ios" ? (
        <Sheet visible={iosOpen} onClose={() => setIosOpen(false)} title={label} closeLabel="Concluir">
          <DateTimePicker value={current} mode="date" display="spinner" locale="pt-BR" themeVariant="dark" maximumDate={maximumDate} minimumDate={minimumDate} onValueChange={(_event, date) => onChange(toIsoDate(date))} />
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space[2] } });
