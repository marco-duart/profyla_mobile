import { StyleSheet, View } from "react-native";
import type { ApplicationDetail, ListApplications } from "@/api/dto";
import { formatDateTime } from "@/lib/format";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

const TONES = {
  positive: { border: colors.success, bg: colors.successSubtle, text: "success" as const },
  negative: { border: colors.error, bg: colors.errorSubtle, text: "error" as const },
  neutral: { border: colors.border, bg: colors.surface, text: "textMuted" as const },
};

export function StatusBadge({ label, tone }: { label: string; tone: ListApplications.Item["status_tone"] }) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { borderColor: palette.border, backgroundColor: palette.bg }]}>
      <Text variant="label" tone={palette.text}>{label.toLowerCase()}</Text>
    </View>
  );
}

const KIND_LABEL: Record<ApplicationDetail.TimelineEntry["kind"], string> = { stage: "Etapa", interview: "Entrevista", form: "Formulário", exam: "Prova" };

/** Linha do tempo vertical: a etapa atual (a última) fica em destaque (plano, 7.5). */
export function Timeline({ entries }: { entries: ApplicationDetail.TimelineEntry[] }) {
  const ordered = [...entries].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <View accessibilityRole="list" style={styles.timeline}>
      {ordered.map((entry, index) => {
        const current = index === ordered.length - 1;
        return (
          <View key={`${entry.kind}-${entry.at}-${index}`} style={styles.item} accessible accessibilityLabel={`${KIND_LABEL[entry.kind]}: ${entry.title}, ${formatDateTime(entry.at)}${current ? ", etapa atual" : ""}`}>
            <View style={styles.rail}>
              <View style={[styles.dot, current ? { backgroundColor: colors.brand, borderColor: colors.brand } : null]} />
              {index < ordered.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.content}>
              <Text variant="label" tone={current ? "tint" : "textMuted"}>{KIND_LABEL[entry.kind]} · {formatDateTime(entry.at)}</Text>
              <Text variant={current ? "heading" : "bodyStrong"}>{entry.title}</Text>
              {entry.description ? <Text tone="textMuted">{entry.description}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderWidth: 1, paddingHorizontal: space[2], paddingVertical: 2 },
  timeline: { gap: 0 },
  item: { flexDirection: "row", gap: space[3] },
  rail: { alignItems: "center", width: 16 },
  dot: { width: 12, height: 12, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.canvas, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  content: { flex: 1, gap: 2, paddingBottom: space[4] },
});
