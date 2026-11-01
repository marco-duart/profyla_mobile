import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAccount, getConsents } from "@/api/account";
import { KEYS, readJson, removeKey, writeJson } from "@/lib/localStore";
import { useSession } from "./SessionProvider";

export type GateActions = { finishOnboarding: () => Promise<void>; startOnboardingFlag: () => Promise<void> };

/** Quem está no onboarding usa estas ações; o provedor fica na raiz (uma só fonte de verdade do portão). */
export const GateActionsContext = createContext<GateActions | null>(null);

export function useGateActions(): GateActions {
  const context = useContext(GateActionsContext);
  if (!context) throw new Error("useGateActions precisa do provedor do portão.");
  return context;
}

export type Gate = "loading" | "error" | "signedOut" | "consent" | "onboarding" | "ready";

/**
 * Em que porta do app a pessoa está (ordem do plano, seção 6): sem sessão → login; consentimento pendente →
 * aceite; sem perfil (ou onboarding em andamento) → onboarding; senão → abas.
 */
export function useGate(): { gate: Gate; retry: () => void; finishOnboarding: () => Promise<void>; startOnboardingFlag: () => Promise<void> } {
  const { status } = useSession();
  const signedIn = status === "signedIn";

  const consents = useQuery({ queryKey: ["consents"], queryFn: getConsents, enabled: signedIn });
  const account = useQuery({ queryKey: ["account"], queryFn: getAccount, enabled: signedIn });
  const [inProgress, setInProgress] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    if (!signedIn) return;
    readJson<boolean>(KEYS.onboardingInProgress, false).then((value) => {
      if (active) setInProgress(value);
    });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const startOnboardingFlag = useCallback(async () => {
    setInProgress(true);
    await writeJson(KEYS.onboardingInProgress, true);
  }, []);

  const finishOnboarding = useCallback(async () => {
    setInProgress(false);
    await removeKey(KEYS.onboardingInProgress);
    await account.refetch();
  }, [account]);

  let gate: Gate;
  if (status === "loading") gate = "loading";
  else if (status === "signedOut") gate = "signedOut";
  else if ((consents.isError && !consents.data) || (account.isError && !account.data)) gate = "error";
  else if (consents.isPending || account.isPending || inProgress === null) gate = "loading";
  else if (consents.data && consents.data.pending.length > 0) gate = "consent";
  else if (!account.data?.candidate_id || inProgress) gate = "onboarding";
  else gate = "ready";

  const retry = () => {
    void consents.refetch();
    void account.refetch();
  };

  return { gate, retry, finishOnboarding, startOnboardingFlag };
}
