import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking } from "react-native";
import { resendConfirmation } from "@/api/auth";
import { errorMessage } from "@/api/errors";
import { t } from "@/i18n/pt-BR";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";

export default function CheckEmail() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await resendConfirmation(email);
      toast.show(t.auth.checkEmail.resent, "success");
    } catch (error) {
      toast.show(errorMessage(error, t.common.unexpected), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <StepLayout title={t.auth.checkEmail.title} onBack={null} primaryLabel={t.auth.checkEmail.openMail} onPrimary={() => void Linking.openURL("mailto:")} secondaryLabel={t.auth.checkEmail.goLogin} onSecondary={() => router.replace("/sign-in")}>
      <Text>{t.auth.checkEmail.message(email)}</Text>
      <Text tone="textMuted">{t.auth.checkEmail.spam}</Text>
      <Button label={t.auth.checkEmail.resend} variant="secondary" onPress={resend} loading={sending} />
    </StepLayout>
  );
}
