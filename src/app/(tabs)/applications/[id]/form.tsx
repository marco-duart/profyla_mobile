import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApplication, submitFormResponse } from "@/api/applications";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { draftKey, formFieldsToSpecs, toFormResponses } from "@/features/applications/useQuestionFlow";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";
import { useToast } from "@/ui/toast/ToastProvider";

/** Formulário do processo: uma pergunta por tela, rascunho salvo no aparelho até o envio (M-11). */
export default function ApplicationForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["application", Number(id)], queryFn: () => getApplication(Number(id)) });
  const tools = query.data?.tools;

  if (query.isPending) return <StepLayout title="Formulário"><SkeletonCard /></StepLayout>;
  if (query.isError || !tools?.dynamic_form_id || tools.form_fields.length === 0) {
    return <StepLayout title="Formulário"><ErrorState message="Este formulário não está disponível." onRetry={() => void query.refetch()} /></StepLayout>;
  }

  return (
    <MicroFlow
      fields={formFieldsToSpecs(tools.form_fields)}
      persistKey={draftKey("form", Number(id))}
      submitLabel="Enviar respostas"
      onExit={() => router.back()}
      onComplete={async (values) => {
        await submitFormResponse({ application_status_id: Number(id), dynamic_form_id: tools.dynamic_form_id as number, form_responses_attributes: toFormResponses(values) });
        await Promise.all(["application", "applications"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
        toast.show("Respostas enviadas!", "success");
        router.back();
      }}
    />
  );
}
