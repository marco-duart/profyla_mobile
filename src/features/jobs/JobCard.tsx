import { StyleSheet, View } from "react-native";
import type { OpportunityList } from "@/api/dto";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

export function jobSummary(job: OpportunityList.Item): string {
  const { title, company_name, job_location, modality } = job.job;
  return [title, company_name, job_location, modality].filter(Boolean).join(", ");
}

/** Conteúdo do card de vaga (feed e detalhe). O arrasto fica por conta do SwipeCard que o envolve. */
export function JobCard({ job, expanded }: { job: OpportunityList.Item; expanded?: boolean }) {
  const { title, company_name, job_location, modality, salary, description, regime, work_schedule, requirements } = job.job;
  return (
    <Surface>
      <Text variant="label" tone="textMuted">{company_name}</Text>
      <Text variant="title" accessibilityRole="header">{title}</Text>
      <View style={styles.meta}>
        {job_location ? <Tag text={job_location} /> : null}
        {modality ? <Tag text={modality} /> : null}
        {regime ? <Tag text={regime} /> : null}
        {salary ? <Tag text={salary} accent /> : null}
      </View>
      <Text tone="textMuted" numberOfLines={expanded ? undefined : 4}>{description}</Text>
      {expanded ? (
        <>
          {work_schedule ? <Info label="Jornada" value={work_schedule} /> : null}
          {requirements ? <Info label="Requisitos" value={requirements} /> : null}
        </>
      ) : null}
    </Surface>
  );
}

function Tag({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <View style={[styles.tag, accent ? { borderColor: colors.accent, backgroundColor: colors.accentSoft } : null]}>
      <Text variant="caption" tone={accent ? "text" : "textMuted"}>{text}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text variant="label" tone="textMuted">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  tag: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: space[2], paddingVertical: space[1] },
  info: { gap: space[1], paddingTop: space[2] },
});
