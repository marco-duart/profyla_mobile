import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { getApplication, respondInterview } from "@/api/applications";
import { errorMessage } from "@/api/errors";
import { addInterviewToCalendar, interviewToEvent } from "@/features/applications/calendar";
import { SwipeCard } from "@/gestures/SwipeCard";
import { formatDateTimeLong } from "@/lib/format";
import { Button } from "@/ui/Button";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";
import { space } from "@/ui/tokens";

/** Convite de entrevista: direita confirma (com confirmação curta), esquerda abre o reagendamento (plano, 7.5). */
export default function Interview() {
  const { id, interviewId } = useLocalSearchParams<{ id: string; interviewId?: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const query = useQuery({ queryKey: ["application", Number(id)], queryFn: () => getApplication(Number(id)) });
  const data = query.data;
  const interview = data?.interviews.find((item) => String(item.id) === interviewId) ?? data?.interviews.find((item) => item.status === "pendente") ?? data?.interviews[0];
  const canRespond = Boolean(data?.tools.can_respond_interview && interview?.status === "pendente");

  const accept = useMutation({
    mutationFn: () => respondInterview(Number(id), { interview_id: interview!.id, response: "accept" }),
    onSuccess: async () => {
      toast.show("Presença confirmada!", "success");
      await Promise.all(["application", "applications"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      setConfirming(false);
    },
    onError: (error) => toast.show(errorMessage(error, "Não foi possível confirmar agora."), "error"),
  });

  const reschedule = () => router.push({ pathname: "/applications/[id]/reschedule", params: { id: String(id), interviewId: String(interview?.id ?? "") } });

  async function addToCalendar() {
    if (!data || !interview) return;
    const result = await addInterviewToCalendar(interviewToEvent(interview, data.job_name, data.company_name), Number(id), interview.id);
    if (result === "added") toast.show("Entrevista adicionada ao seu calendário.", "success");
    else if (result === "shared") toast.show("Escolha o app de calendário para salvar.", "info");
    else toast.show("Não foi possível adicionar ao calendário agora.", "error");
  }

  return (
    <StepLayout title="Entrevista" help={data ? `${data.job_name} · ${data.company_name}` : undefined}>
      {query.isPending ? <SkeletonCard /> : null}
      {query.isError || (query.isSuccess && !interview) ? <ErrorState message="Não encontramos esta entrevista." onRetry={() => void query.refetch()} /> : null}
      {interview ? (
        <>
          <SwipeCard
            onSwipeRight={canRespond ? () => setConfirming(true) : undefined}
            onSwipeLeft={canRespond ? reschedule : undefined}
            rightLabel={canRespond ? "CONFIRMO" : undefined}
            leftLabel={canRespond ? "REMARCAR" : undefined}
            accessibilityLabel={`Entrevista ${formatDateTimeLong(interview.date_time)}, ${interview.interview_method}`}
          >
            <Surface>
              <Text variant="label" tone="textMuted">{interview.status === "pendente" ? "Convite pendente" : `Entrevista · ${interview.status ?? "agendada"}`}</Text>
              <Text variant="title">{formatDateTimeLong(interview.date_time)}</Text>
              <Info label="Tipo" value={interview.interview_type} />
              <Info label="Entrevistador(a)" value={interview.interviewer} />
              <Info label="Como será" value={interview.interview_method} />
              {interview.resume ? <Info label="Detalhes" value={interview.resume} /> : null}
              {interview.suggested_datetime ? <Info label="Você sugeriu" value={formatDateTimeLong(interview.suggested_datetime)} /> : null}
            </Surface>
          </SwipeCard>

          {confirming ? (
            <Surface>
              <Text variant="bodyStrong" accessibilityRole="alert">Confirmar presença em {formatDateTimeLong(interview.date_time)}?</Text>
              <View style={styles.row}>
                <Button label="Confirmo" onPress={() => accept.mutate()} loading={accept.isPending} style={styles.flex} />
                <Button label="Cancelar" variant="secondary" onPress={() => setConfirming(false)} style={styles.flex} />
              </View>
            </Surface>
          ) : canRespond ? (
            <View style={styles.row}>
              <Button label="Preciso remarcar" variant="secondary" onPress={reschedule} style={styles.flex} />
              <Button label="Confirmo" onPress={() => setConfirming(true)} style={styles.flex} />
            </View>
          ) : null}

          <Button label="Adicionar ao calendário" variant="secondary" onPress={() => void addToCalendar()} fullWidth />
          {canRespond ? <Text variant="caption" tone="textMuted" center>Dica: arraste o card para a direita para confirmar ou para a esquerda para remarcar.</Text> : null}
        </>
      ) : null}
    </StepLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text variant="label" tone="textMuted">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[3] },
  flex: { flex: 1 },
  info: { gap: 2 },
});
