import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getOpportunity } from "@/api/jobs";
import { JobCard } from "@/features/jobs/JobCard";
import { useApplyToJob } from "@/features/jobs/useApplyToJob";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { Text } from "@/ui/Text";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const apply = useApplyToJob();
  const job = useQuery({ queryKey: ["job", id], queryFn: () => getOpportunity(Number(id)) });
  const data = job.data;

  const setApplied = (value: boolean) => queryClient.setQueryData(["job", id], (current: typeof data) => (current ? { ...current, already_applied: value } : current));

  return (
    <StepLayout
      title="Detalhe da vaga"
      primaryLabel={data ? (data.already_applied ? "Você já se candidatou" : "Quero esta vaga") : undefined}
      primaryDisabled={!data || data.already_applied}
      onPrimary={() => data && apply(data, { onLocalApply: () => setApplied(true), onRevert: () => setApplied(false) })}
      secondaryLabel="Voltar às vagas"
      onSecondary={() => router.back()}
    >
      {job.isPending ? <SkeletonCard /> : null}
      {job.isError ? <ErrorState message="Não foi possível abrir a vaga. Ela pode ter sido encerrada." onRetry={() => void job.refetch()} /> : null}
      {data ? (
        <>
          <JobCard job={data} expanded />
          {data.already_applied ? <Text tone="success" accessibilityRole="alert">Você já se candidatou a esta vaga. Acompanhe na aba Candidaturas.</Text> : null}
          {!data.already_applied && !data.initial_stage_id ? <Button label="Esta vaga ainda não aceita candidaturas" variant="secondary" disabled /> : null}
        </>
      ) : null}
    </StepLayout>
  );
}
