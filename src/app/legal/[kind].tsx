import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getLegalDocument } from "@/api/account";
import type { Legal } from "@/api/dto";
import { Button } from "@/ui/Button";
import { Markdown } from "@/ui/Markdown";
import { Screen } from "@/ui/Screen";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";

const KINDS: Legal.Kind[] = ["terms", "privacy", "assessment_notice"];

/** Termos, política e aviso dos testes: textos públicos, abrem em qualquer estado do app. */
export default function LegalDocument() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const router = useRouter();
  const valid = KINDS.includes(kind as Legal.Kind);
  const query = useQuery({ queryKey: ["legal", kind], queryFn: () => getLegalDocument(kind as Legal.Kind), enabled: valid, staleTime: 10 * 60_000 });

  return (
    <Screen footer={<Button label="Fechar" variant="secondary" onPress={() => router.back()} fullWidth />}>
      {query.isPending && valid ? <SkeletonCard /> : null}
      {query.isError || !valid ? <ErrorState message="Não foi possível abrir o documento." onRetry={valid ? () => void query.refetch() : undefined} /> : null}
      {query.data ? <Markdown source={query.data.content} /> : null}
    </Screen>
  );
}
