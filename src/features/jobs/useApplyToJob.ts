import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { createApplication } from "@/api/applications";
import type { OpportunityList } from "@/api/dto";
import { errorMessage } from "@/api/errors";
import { t } from "@/i18n/pt-BR";
import { useToast } from "@/ui/toast/ToastProvider";

/**
 * Candidatar-se (swipe ou botão): a tela reage na hora e a chamada à API só acontece depois dos 5 s do
 * "Desfazer" (D-M08). Se o usuário desfizer, nada vai ao servidor; se o servidor recusar, a tela volta atrás.
 */
export function useApplyToJob() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useCallback(
    (job: OpportunityList.Item, hooks: { onLocalApply: () => void; onRevert: () => void }) => {
      if (!job.initial_stage_id) {
        toast.show("Esta vaga ainda não está aceitando candidaturas.", "error");
        return;
      }
      if (!onlineManager.isOnline()) {
        toast.show(t.common.needsConnection, "error");
        return;
      }
      hooks.onLocalApply();
      toast.undoable({
        message: `Candidatando-se a ${job.job.title}`,
        revert: hooks.onRevert,
        commit: async () => {
          try {
            await createApplication({ hiring_process_stage_id: job.initial_stage_id as number });
            toast.show("Candidatura enviada!", "success");
            await Promise.all(["jobs", "applications", "home"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
          } catch (error) {
            hooks.onRevert();
            toast.show(errorMessage(error, "Não foi possível enviar a candidatura."), "error");
          }
        },
      });
    },
    [queryClient, toast],
  );
}
