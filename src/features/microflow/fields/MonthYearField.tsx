import { StyleSheet, View } from "react-native";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Text } from "@/ui/Text";
import { space } from "@/ui/tokens";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Props = {
  label: string;
  /** "YYYY-MM" ou vazio. */
  value: string | null;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  error?: string | null;
};

export function splitMonthYear(value: string | null, fallbackYear: number): { year: number; month: number | null } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  return match ? { year: Number(match[1]), month: Number(match[2]) } : { year: fallbackYear, month: null };
}

export const joinMonthYear = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

/** Mês e ano sem teclado: setas para o ano e uma grade de meses (experiência, formação). */
export function MonthYearField({ label, value, onChange, minYear = 1960, maxYear = new Date().getFullYear(), error }: Props) {
  const { year, month } = splitMonthYear(value, maxYear);
  const setYear = (next: number) => onChange(joinMonthYear(Math.min(maxYear, Math.max(minYear, next)), month ?? 1));
  return (
    <View style={styles.wrap} accessibilityLabel={label}>
      <Text variant="label" tone="textMuted">{label}</Text>
      <View style={styles.yearRow}>
        <Button label="Ano anterior" variant="secondary" onPress={() => setYear(year - 1)} disabled={year <= minYear} />
        <Text variant="title" accessibilityLiveRegion="polite">{year}</Text>
        <Button label="Próximo ano" variant="secondary" onPress={() => setYear(year + 1)} disabled={year >= maxYear} />
      </View>
      <View style={styles.grid}>
        {MONTHS.map((name, index) => (
          <Chip key={name} label={name} selected={month === index + 1} onPress={() => onChange(joinMonthYear(year, index + 1))} />
        ))}
      </View>
      {error ? <Text variant="caption" tone="error" accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
