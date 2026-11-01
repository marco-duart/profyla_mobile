import { StyleSheet, View } from "react-native";
import type { DiscResult, EneagramaResult } from "@/api/dto";
import { formatDate } from "@/lib/format";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

const DISC_LABELS: Record<string, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };
const TYPE_LABELS: Record<string, string> = { E1: "Reformador", E2: "Prestativo", E3: "Realizador", E4: "Individualista", E5: "Investigador", E6: "Leal", E7: "Entusiasta", E8: "Desafiador", E9: "Pacificador" };
const CENTER_LABELS: Record<string, string> = { instinctive: "Instintivo", emotional: "Emocional", mental: "Mental" };

/** Barra rotulada de 0 a 100 (acessível: o valor vai no rótulo). */
export function ScoreBar({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.bar} accessible accessibilityLabel={`${label}: ${Math.round(pct)} de 100`}>
      <View style={styles.barLabel}>
        <Text tone="textMuted">{label}</Text>
        <Text variant="bodyStrong">{Math.round(pct)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent ? colors.accent : colors.brand }]} />
      </View>
    </View>
  );
}

export function DiscResultView({ attempt }: { attempt: DiscResult.Attempt }) {
  return (
    <View style={styles.wrap}>
      <Text tone="success">Realizado em {formatDate(attempt.completed_at)}</Text>
      <Text variant="heading">Perfil predominante: {attempt.profile.label}</Text>
      <Surface>
        {(Object.keys(DISC_LABELS) as (keyof DiscResult.Dimensions)[]).map((key) => (
          <ScoreBar key={key} label={`${DISC_LABELS[key]} (${key})`} value={attempt.dimensions[key]} />
        ))}
      </Surface>
      {attempt.interpretation ? (
        <>
          <Text variant="heading">O que isso sugere</Text>
          {attempt.interpretation.dimensions.map((dimension) => (
            <Surface key={dimension.key}>
              <Text variant="bodyStrong">{dimension.name}: {dimension.band_label}</Text>
              <Text tone="textMuted">{dimension.text}</Text>
            </Surface>
          ))}
          <Text variant="caption" tone="textMuted">{attempt.interpretation.disclaimer}</Text>
        </>
      ) : null}
    </View>
  );
}

export function EneagramaResultView({ attempt }: { attempt: EneagramaResult.Attempt }) {
  return (
    <View style={styles.wrap}>
      <Text tone="success">Realizado em {formatDate(attempt.completed_at)}</Text>
      <Text variant="heading">Perfil predominante: {TYPE_LABELS[attempt.profile.primary]} ({attempt.profile.label})</Text>
      <Surface>
        {(Object.keys(TYPE_LABELS) as (keyof EneagramaResult.Types)[]).map((key) => (
          <ScoreBar key={key} label={`${TYPE_LABELS[key]} (${key})`} value={attempt.types[key]} />
        ))}
      </Surface>
      <Text variant="heading">Centros</Text>
      <Surface>
        {(Object.keys(CENTER_LABELS) as (keyof EneagramaResult.Centers)[]).map((key) => (
          <ScoreBar key={key} label={CENTER_LABELS[key]} value={attempt.centers[key]} accent />
        ))}
      </Surface>
      {attempt.interpretation ? (
        <>
          <Text variant="heading">O que isso sugere</Text>
          {[attempt.interpretation.primary, attempt.interpretation.secondary].map((type, index) =>
            type ? (
              <Surface key={type.key}>
                <Text variant="bodyStrong">{index === 0 ? "Tipo predominante" : "Segundo tipo"}: {type.name}</Text>
                <Text tone="textMuted">{type.summary}</Text>
                <Text tone="textMuted">Ponto de atenção: {type.attention}</Text>
              </Surface>
            ) : null,
          )}
          <Text tone="textMuted">{attempt.interpretation.wing}</Text>
          <Text variant="caption" tone="textMuted">{attempt.interpretation.disclaimer}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  bar: { gap: space[1], paddingVertical: space[2] },
  barLabel: { flexDirection: "row", justifyContent: "space-between" },
  track: { height: 6, backgroundColor: colors.surfaceStrong },
  fill: { height: 6 },
});
