import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getApplication, submitExamResponse } from "@/api/applications";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { draftKey, examQuestionsToSpecs, toExamResponses } from "@/features/applications/useQuestionFlow";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";
import { useToast } from "@/ui/toast/ToastProvider";

/** Prova do processo: uma pergunta por tela, tocar na alternativa já avança (M-11). */
export default function ApplicationExam() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["application", Number(id)], queryFn: () => getApplication(Number(id)) });
  const tools = query.data?.tools;

  if (query.isPending) return <StepLayout title="Prova"><SkeletonCard /></StepLayout>;
  if (query.isError || !tools?.dynamic_exam_id || tools.exam_questions.length === 0) {
    return <StepLayout title="Prova"><ErrorState message="Esta prova não está disponível." onRetry={() => void query.refetch()} /></StepLayout>;
  }

  return (
    <MicroFlow
      fields={examQuestionsToSpecs(tools.exam_questions)}
      persistKey={draftKey("exam", Number(id))}
      submitLabel="Enviar prova"
      onExit={() => router.back()}
      onComplete={async (values) => {
        await submitExamResponse({ application_status_id: Number(id), dynamic_exam_id: tools.dynamic_exam_id as number, exam_responses_attributes: toExamResponses(values) });
        await Promise.all(["application", "applications"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
        toast.show("Prova enviada!", "success");
        router.back();
      }}
    />
  );
}
