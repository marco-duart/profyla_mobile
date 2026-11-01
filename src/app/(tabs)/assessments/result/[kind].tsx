import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDiscResult, getEneagramaResult } from "@/api/assessments";
import { DiscResultView, EneagramaResultView } from "@/features/assessments/ResultView";
import { SkeletonCard } from "@/ui/Skeleton";
import { EmptyState, ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";

export default function AssessmentResult() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const router = useRouter();
  const isDisc = kind === "disc";
  const disc = useQuery({ queryKey: ["disc-result"], queryFn: getDiscResult, enabled: isDisc });
  const eneagrama = useQuery({ queryKey: ["eneagrama-result"], queryFn: getEneagramaResult, enabled: !isDisc });
  const query = isDisc ? disc : eneagrama;
  const title = isDisc ? "Resultado do DISC" : "Resultado do Eneagrama";
  const latest = query.data?.latest;

  return (
    <StepLayout title={title} onBack={() => router.replace("/(tabs)/assessments")} primaryLabel="Concluir" onPrimary={() => router.replace("/(tabs)/assessments")}>
      {query.isPending ? <SkeletonCard /> : null}
      {query.isError ? <ErrorState message="Não foi possível carregar o resultado." onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && !latest ? <EmptyState title="Ainda não há resultado" message="Faça o teste para ver o seu perfil." /> : null}
      {latest ? (isDisc ? <DiscResultView attempt={disc.data!.latest!} /> : <EneagramaResultView attempt={eneagrama.data!.latest!} />) : null}
    </StepLayout>
  );
}
