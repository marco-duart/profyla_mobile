import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { getApplication, withdrawApplication } from "@/api/applications";
import { errorMessage } from "@/api/errors";
import { StatusBadge, Timeline } from "@/features/applications/ui";
import { formatDateTimeLong } from "@/lib/format";
import { Button } from "@/ui/Button";
import { Sheet } from "@/ui/Sheet";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { useToast } from "@/ui/toast/ToastProvider";

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["application", Number(id)], queryFn: () => getApplication(Number(id)) });
  const data = query.data;

  const withdraw = useMutation({
    mutationFn: () => withdrawApplication(Number(id), { feedback: reason.trim() }),
    onSuccess: async () => {
      setConfirmOpen(false);
      toast.show("Você desistiu da candidatura.", "info");
      await Promise.all(["applications", "application", "home"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      router.back();
    },
    onError: (error) => toast.show(errorMessage(error, "Não foi possível desistir agora."), "error"),
  });

  const pendingInterview = data?.interviews.find((item) => item.status === "pendente");
  const tools = data?.tools;

  return (
    <StepLayout title={data?.job_name ?? "Candidatura"} help={data ? `${data.company_name}${data.job_location ? ` · ${data.job_location}` : ""}` : undefined}>
      {query.isPending ? <SkeletonCard /> : null}
      {query.isError ? <ErrorState message="Não foi possível abrir a candidatura." onRetry={() => void query.refetch()} /> : null}
      {data && tools ? (
        <>
          <StatusBadge label={data.stage} tone={data.status_tone} />
          {data.summary ? <Text tone="textMuted">{data.summary}</Text> : null}

          {tools.has_exam && !tools.exam_already_submitted ? (
            <Button label="Responder a prova" onPress={() => router.push({ pathname: "/applications/[id]/exam", params: { id: String(id) } })} fullWidth />
          ) : null}
          {tools.has_form && !tools.form_already_submitted ? (
            <Button label="Responder ao formulário" onPress={() => router.push({ pathname: "/applications/[id]/form", params: { id: String(id) } })} fullWidth />
          ) : null}
          {tools.can_respond_interview && pendingInterview ? (
            <Surface>
              <Text variant="label" tone="warning">Convite de entrevista</Text>
              <Text variant="heading">{formatDateTimeLong(pendingInterview.date_time)}</Text>
              <Button label="Responder ao convite" onPress={() => router.push({ pathname: "/applications/[id]/interview", params: { id: String(id), interviewId: String(pendingInterview.id) } })} />
            </Surface>
          ) : null}

          {data.interviews.filter((item) => item.status !== "pendente").map((item) => (
            <Surface key={item.id}>
              <Text variant="label" tone="textMuted">Entrevista · {item.status ?? "agendada"}</Text>
              <Text variant="bodyStrong">{formatDateTimeLong(item.date_time)}</Text>
              <Button label="Ver detalhes e calendário" variant="secondary" onPress={() => router.push({ pathname: "/applications/[id]/interview", params: { id: String(id), interviewId: String(item.id) } })} />
            </Surface>
          ))}

          {data.feedback?.specific_comment ? (
            <Surface>
              <Text variant="label" tone="textMuted">Retorno do recrutador</Text>
              <Text>{data.feedback.specific_comment}</Text>
              {data.feedback.improvements ? <Text tone="textMuted">{data.feedback.improvements}</Text> : null}
            </Surface>
          ) : null}

          <Text variant="heading">Andamento</Text>
          <Timeline entries={data.timeline} />

          {tools.can_withdraw ? <Button label="Desistir da candidatura" variant="danger" onPress={() => setConfirmOpen(true)} fullWidth /> : null}

          {/* Desistir é irreversível: só por botão, com confirmação em sheet (nunca por gesto). */}
          <Sheet visible={confirmOpen} onClose={() => setConfirmOpen(false)} title="Desistir desta candidatura?" closeLabel="Voltar">
            <Text tone="textMuted">Isso encerra a candidatura e não pode ser desfeito.</Text>
            <TextField label="Quer contar o motivo? (opcional)" value={reason} onChangeText={setReason} multiline />
            <Button label="Confirmar desistência" variant="danger" loading={withdraw.isPending} onPress={() => withdraw.mutate()} fullWidth />
          </Sheet>
        </>
      ) : null}
    </StepLayout>
  );
}
