import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { acceptConsents, getConsents } from "@/api/account";
import type { Legal } from "@/api/dto";
import { errorMessage } from "@/api/errors";
import { useSession } from "@/features/session/SessionProvider";
import { t } from "@/i18n/pt-BR";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";
import { colors, space } from "@/ui/tokens";

/** Portão de consentimento: sem aceite da versão vigente, nenhuma aba abre (M-05). */
export default function Accept() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { signOut } = useSession();
  const consents = useQuery({ queryKey: ["consents"], queryFn: getConsents });
  const [agreed, setAgreed] = useState(false);

  const accept = useMutation({
    mutationFn: (kinds: Legal.Kind[]) => acceptConsents(kinds),
    onSuccess: (result) => {
      queryClient.setQueryData(["consents"], result);
      toast.show(t.consent.accepted, "success");
    },
    onError: (error) => toast.show(errorMessage(error, t.common.unexpected), "error"),
  });

  const pending = consents.data?.pending ?? [];
  return (
    <StepLayout title={t.consent.title} help={t.consent.help} onBack={null} primaryLabel={t.consent.submit} primaryDisabled={!agreed || pending.length === 0} primaryLoading={accept.isPending} onPrimary={() => accept.mutate(pending)} secondaryLabel={t.consent.signOut} onSecondary={() => void signOut()}>
      {pending.map((kind) => (
        <View key={kind} style={styles.row}>
          <Text variant="bodyStrong" style={styles.flex}>{t.consent.docs[kind]}</Text>
          <Button label={`${t.consent.read}: ${t.consent.docs[kind]}`} variant="secondary" onPress={() => router.push({ pathname: "/legal/[kind]", params: { kind } })} />
        </View>
      ))}
      <Chip label={t.consent.agree} selected={agreed} onPress={() => setAgreed((value) => !value)} />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[3], borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: space[3] },
  flex: { flex: 1 },
});
