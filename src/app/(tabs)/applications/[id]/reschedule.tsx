import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { addDays } from "date-fns";
import { respondInterview } from "@/api/applications";
import { errorMessage } from "@/api/errors";
import { TIME_SLOTS, isFuture, toSuggestedDateTime } from "@/features/applications/reschedule";
import { DateField } from "@/features/microflow/fields/DateField";
import { Chip } from "@/ui/Chip";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { useToast } from "@/ui/toast/ToastProvider";
import { space } from "@/ui/tokens";

/** Pedido de reagendamento: data e horário sugeridos (escolhidos, não digitados) e um recado opcional. */
export default function Reschedule() {
  const { id, interviewId } = useLocalSearchParams<{ id: string; interviewId: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: () => respondInterview(Number(id), { interview_id: Number(interviewId), response: "reschedule", suggested_datetime: toSuggestedDateTime(date!, time!), message: message.trim() || undefined }),
    onSuccess: async () => {
      toast.show("Pedido de reagendamento enviado.", "success");
      await Promise.all(["application", "applications"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      router.back();
    },
    onError: (failure) => toast.show(errorMessage(failure, "Não foi possível enviar agora."), "error"),
  });

  const submit = () => {
    if (!date || !time) return setError("Escolha a data e o horário.");
    if (!isFuture(date, time)) return setError("Escolha um horário no futuro.");
    setError(null);
    send.mutate();
  };

  return (
    <StepLayout title="Preciso remarcar" help="Sugira outro dia e horário. O recrutador recebe o seu pedido." primaryLabel="Enviar pedido" onPrimary={submit} primaryLoading={send.isPending}>
      <DateField label="Data sugerida" value={date} onChange={setDate} minimumDate={addDays(new Date(), 1)} maximumDate={addDays(new Date(), 120)} />
      <Text variant="label" tone="textMuted">Horário</Text>
      <View style={styles.chips}>
        {TIME_SLOTS.map((slot) => <Chip key={slot} label={slot} selected={time === slot} onPress={() => setTime(slot)} />)}
      </View>
      <TextField label="Recado (opcional)" value={message} onChangeText={setMessage} multiline placeholder="Ex.: tenho um compromisso nesse horário" />
      {error ? <Text tone="error" accessibilityRole="alert">{error}</Text> : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] } });
