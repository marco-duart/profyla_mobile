import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createCandidateProfile } from "@/api/profile";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { PROFILE_FIELDS, toProfileParams } from "@/features/onboarding/profileFields";
import { useGateActions } from "@/features/session/useGate";
import { KEYS, readJson } from "@/lib/localStore";

/** Etapa mínima do perfil: nove micro-passos salvos a cada resposta; ao concluir, cria o perfil (M-06). */
export default function ProfileSteps() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startOnboardingFlag } = useGateActions();

  return (
    <MicroFlow
      fields={PROFILE_FIELDS}
      persistKey={KEYS.onboardingDraft + ".profile"}
      submitLabel="Criar meu perfil"
      onExit={() => router.replace("/start")}
      onComplete={async (values) => {
        // O portão só libera as abas quando o onboarding termina; a marca vem ANTES de o perfil existir no servidor.
        await startOnboardingFlag();
        await createCandidateProfile(toProfileParams(values));
        await queryClient.invalidateQueries({ queryKey: ["account"] });
        const draft = await readJson<{ startWith?: "pdf" | "questions" }>(KEYS.onboardingDraft, {});
        router.replace(draft.startWith === "pdf" ? "/import-pick" : "/experience");
      }}
    />
  );
}
