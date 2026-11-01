import { useQuery } from "@tanstack/react-query";
import { getHome } from "@/api/profile";
import { useGateActions } from "@/features/session/useGate";
import { removeKey, KEYS } from "@/lib/localStore";
import { Progress } from "@/ui/Progress";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";

export default function Done() {
  const { finishOnboarding } = useGateActions();
  const home = useQuery({ queryKey: ["home"], queryFn: getHome });
  const completion = home.data?.profile_completion;

  return (
    <StepLayout
      title="Pronto!"
      help="Seu perfil está no ar. Quanto mais completo, melhor a aderência às vagas."
      onBack={null}
      primaryLabel="Ver vagas para você"
      onPrimary={async () => {
        await removeKey(KEYS.onboardingDraft);
        await finishOnboarding();
      }}
    >
      {typeof completion === "number" ? (
        <>
          <Progress current={completion} total={100} label={`Perfil ${completion}% completo`} />
          <Text tone="textMuted">Você pode completar o resto depois, na aba Perfil.</Text>
        </>
      ) : null}
    </StepLayout>
  );
}
