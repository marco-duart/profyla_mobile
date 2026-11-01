import { useState } from "react";
import { requestPasswordReset } from "@/api/auth";
import { errorMessage } from "@/api/errors";
import { t } from "@/i18n/pt-BR";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!isValidEmail(email)) {
      setError(t.auth.invalidEmail);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(normalizeEmail(email));
      setSent(true);
    } catch (failure) {
      setError(errorMessage(failure, t.common.unexpected));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepLayout title={t.auth.forgotPassword.title} help={sent ? undefined : t.auth.forgotPassword.help} primaryLabel={sent ? undefined : t.auth.forgotPassword.submit} onPrimary={submit} primaryLoading={loading}>
      {sent ? (
        <Text accessibilityRole="alert">{t.auth.forgotPassword.sent}</Text>
      ) : (
        <TextField label={t.auth.email} value={email} onChangeText={setEmail} error={error} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus onSubmitEditing={submit} />
      )}
    </StepLayout>
  );
}
