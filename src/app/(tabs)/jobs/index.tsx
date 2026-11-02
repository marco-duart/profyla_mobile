import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { listOpportunities } from "@/api/jobs";
import type { OpportunityList } from "@/api/dto";
import { SwipeCard } from "@/gestures/SwipeCard";
import { GestureHint } from "@/gestures/GestureHint";
import { jobSummary, JobCard } from "@/features/jobs/JobCard";
import { NovidadesHome } from "@/features/novidades/NovidadesHome";
import { useApplyToJob } from "@/features/jobs/useApplyToJob";
import { useDismissedJobs } from "@/features/jobs/useDismissedJobs";
import { useGestureHint } from "@/features/jobs/useGestureHint";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Screen } from "@/ui/Screen";
import { Sheet } from "@/ui/Sheet";
import { TabHeader } from "@/ui/TabHeader";
import { SkeletonCard } from "@/ui/Skeleton";
import { EmptyState, ErrorState } from "@/ui/States";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { useToast } from "@/ui/toast/ToastProvider";
import { space } from "@/ui/tokens";

/** Feed de vagas em cards: direita candidata, esquerda dispensa, tocar abre o detalhe (plano, 7.4). */
export default function JobsFeed() {
  const router = useRouter();
  const toast = useToast();
  const apply = useApplyToJob();
  const hint = useGestureHint();
  const { dismissed, ready, dismiss, restore } = useDismissedJobs();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [appliedLocal, setAppliedLocal] = useState<ReadonlySet<number>>(new Set());

  const jobs = useQuery({ queryKey: ["jobs", search], queryFn: () => listOpportunities(search || undefined) });
  const dismissedIds = useMemo(() => new Set(dismissed.map((item) => item.id)), [dismissed]);
  const visible = useMemo(() => (jobs.data ?? []).filter((job) => !job.already_applied && !dismissedIds.has(job.hiring_process_id) && !appliedLocal.has(job.hiring_process_id)), [jobs.data, dismissedIds, appliedLocal]);
  const current = visible[0];

  const open = (job: OpportunityList.Item) => router.push({ pathname: "/jobs/[id]", params: { id: String(job.hiring_process_id) } });

  const onApply = (job: OpportunityList.Item) => {
    hint.markUsed();
    apply(job, {
      onLocalApply: () => setAppliedLocal((set) => new Set(set).add(job.hiring_process_id)),
      onRevert: () => setAppliedLocal((set) => { const next = new Set(set); next.delete(job.hiring_process_id); return next; }),
    });
  };

  const onDismiss = (job: OpportunityList.Item) => {
    hint.markUsed();
    dismiss({ id: job.hiring_process_id, title: job.job.title, company: job.job.company_name });
    toast.undoable({ message: `Vaga dispensada: ${job.job.title}`, revert: () => restore(job.hiring_process_id), commit: () => undefined });
  };

  return (
    <Screen insideTabs refreshControl={<RefreshControl refreshing={jobs.isRefetching} onRefresh={() => void jobs.refetch()} tintColor="#fff" />}>
      <TabHeader title="Vagas" action={<Button label="Buscar" variant="secondary" onPress={() => { setDraft(search); setSearchOpen(true); }} />} />
      {search ? <Chip label={`Busca: ${search} ✕`} selected onPress={() => setSearch("")} /> : null}

      {jobs.isPending || !ready ? <SkeletonCard /> : null}
      {jobs.isError ? <ErrorState message="Não foi possível carregar as vagas." onRetry={() => void jobs.refetch()} /> : null}

      {current ? (
        <View style={styles.stack}>
          {hint.show ? <GestureHint leftLabel="Agora não" rightLabel="Quero esta vaga" /> : null}
          <SwipeCard
            key={current.hiring_process_id}
            onSwipeRight={() => onApply(current)}
            onSwipeLeft={() => onDismiss(current)}
            rightLabel="QUERO"
            leftLabel="AGORA NÃO"
            onOpen={() => open(current)}
            openLabel="Abrir detalhes da vaga"
            accessibilityLabel={jobSummary(current)}
          >
            <JobCard job={current} />
          </SwipeCard>
          <View style={styles.actions}>
            <Button label="Agora não" variant="secondary" onPress={() => onDismiss(current)} style={styles.flex} />
            <Button label="Quero esta vaga" onPress={() => onApply(current)} style={styles.flex} />
          </View>
          <Button label="Ver detalhes" variant="ghost" onPress={() => open(current)} />
          {visible.length > 1 ? <Text variant="caption" tone="textMuted" center>Mais {visible.length - 1} {visible.length - 1 === 1 ? "vaga" : "vagas"} na fila</Text> : null}
        </View>
      ) : jobs.isSuccess && ready ? (
        <EmptyState
          title={search ? "Nenhuma vaga para essa busca" : "Você viu todas as vagas abertas"}
          message={search ? "Tente outras palavras ou limpe a busca." : "Avisamos quando surgirem novas."}
          actionLabel={dismissed.length ? "Ver vagas dispensadas" : undefined}
          onAction={() => router.push("/(tabs)/profile")}
        />
      ) : null}

      <NovidadesHome />

      <Sheet visible={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar vagas" closeLabel="Cancelar">
        <TextField label="Título da vaga" value={draft} onChangeText={setDraft} placeholder="Ex.: analista, vendedor" autoFocus returnKeyType="search" onSubmitEditing={() => { setSearch(draft.trim()); setSearchOpen(false); }} />
        <Button label="Buscar" onPress={() => { setSearch(draft.trim()); setSearchOpen(false); }} fullWidth />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[3] },
  actions: { flexDirection: "row", gap: space[3] },
  flex: { flex: 1 },
});
