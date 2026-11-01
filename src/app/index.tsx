import { Redirect } from "expo-router";
import { useGate } from "@/features/session/useGate";
import { usePendingTasks } from "@/features/applications/usePendingTasks";
import { initialTab } from "@/features/applications/pending";
import { Text } from "@/ui/Text";

/** Âncora do app: manda cada estado para a sua porta. Com pendência abre em Candidaturas; sem, em Vagas. */
export default function Index() {
  const { gate } = useGate();
  const { tasks, loading } = usePendingTasks();

  if (gate === "signedOut") return <Redirect href="/welcome" />;
  if (gate === "consent") return <Redirect href="/accept" />;
  if (gate === "onboarding") return <Redirect href="/start" />;
  if (gate === "ready") {
    if (loading) return null;
    return <Redirect href={initialTab(tasks) === "applications" ? "/(tabs)/applications" : "/(tabs)/jobs"} />;
  }
  return <Text>...</Text>;
}
