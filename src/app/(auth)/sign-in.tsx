import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { errorMessage } from "@/api/errors";
import { useSession } from "@/features/session/SessionProvider";
import { t } from "@/i18n/pt-BR";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { TextField, type TextFieldHandle } from "@/ui/TextField";

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useSession();
  const passwordRef = useRef<TextFieldHandle>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const found: typeof errors = {};
    if (!isValidEmail(email)) found.email = t.auth.invalidEmail;
    if (!password) found.password = t.auth.passwordRequired;
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await signIn(normalizeEmail(email), password);
    } catch (error) {
      setServerError(errorMessage(error, t.common.unexpected));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepLayout title={t.auth.signInTitle} primaryLabel={t.auth.signIn} onPrimary={submit} primaryLoading={loading} secondaryLabel={t.auth.forgot} onSecondary={() => router.push("/forgot-password")}>
      <TextField
        label={t.auth.email}
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label={t.auth.password}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {serverError ? <Text tone="error" accessibilityRole="alert">{serverError}</Text> : null}
      <Button label={t.auth.create} variant="ghost" onPress={() => router.replace("/sign-up/name")} />
    </StepLayout>
  );
}
