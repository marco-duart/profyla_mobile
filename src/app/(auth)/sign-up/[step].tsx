import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { register } from "@/api/auth";
import { errorMessage } from "@/api/errors";
import { SIGN_UP_STEPS, useSignUp, type SignUpStep } from "@/features/auth/SignUpContext";
import { t } from "@/i18n/pt-BR";
import { isValidCpf, maskCpf, onlyDigits } from "@/lib/masks";
import { isValidEmail, MIN_PASSWORD_LENGTH, normalizeEmail, passwordStrength } from "@/lib/validation";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { colors, MIN_TOUCH, radii, space } from "@/ui/tokens";

const TOTAL = SIGN_UP_STEPS.length;

export default function SignUpStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();
  const { values, set, reset } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!SIGN_UP_STEPS.includes(step as SignUpStep)) return <Redirect href="/sign-up/name" />;
  const current = step as SignUpStep;
  const index = SIGN_UP_STEPS.indexOf(current) + 1;
  const next = () => router.push(`/sign-up/${SIGN_UP_STEPS[index]}` as never);

  if (current === "name") {
    return (
      <StepLayout title={t.auth.signUp.name.title} help={t.auth.signUp.name.help} step={index} total={TOTAL} primaryLabel={t.common.continue}
        onPrimary={() => (values.name.trim().split(/\s+/).length >= 2 ? (setError(null), next()) : setError(t.auth.signUp.name.error))}>
        <TextField label={t.auth.signUp.name.label} value={values.name} onChangeText={(v) => set("name", v)} error={error} autoFocus autoCapitalize="words" autoComplete="name" returnKeyType="next"
          onSubmitEditing={() => (values.name.trim().split(/\s+/).length >= 2 ? next() : setError(t.auth.signUp.name.error))} />
      </StepLayout>
    );
  }

  if (current === "email") {
    return (
      <StepLayout title={t.auth.signUp.email.title} help={t.auth.signUp.email.help} step={index} total={TOTAL} primaryLabel={t.common.continue}
        onPrimary={() => (isValidEmail(values.email) ? (setError(null), next()) : setError(t.auth.invalidEmail))}>
        <TextField label={t.auth.signUp.email.label} value={values.email} onChangeText={(v) => set("email", v)} error={error} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus returnKeyType="next"
          onSubmitEditing={() => (isValidEmail(values.email) ? next() : setError(t.auth.invalidEmail))} />
      </StepLayout>
    );
  }

  if (current === "cpf") {
    return (
      <StepLayout title={t.auth.signUp.cpf.title} help={t.auth.signUp.cpf.help} step={index} total={TOTAL} primaryLabel={t.common.continue}
        onPrimary={() => (isValidCpf(values.cpf) ? (setError(null), next()) : setError(t.auth.signUp.cpf.error))}>
        <TextField label={t.auth.signUp.cpf.label} value={values.cpf} onChangeText={(v) => set("cpf", v)} format={maskCpf} error={error} keyboardType="number-pad" autoFocus
          onSubmitEditing={() => (isValidCpf(values.cpf) ? next() : setError(t.auth.signUp.cpf.error))} />
      </StepLayout>
    );
  }

  if (current === "password") {
    const strength = passwordStrength(values.password);
    const validate = () => {
      if (values.password.length < MIN_PASSWORD_LENGTH) return t.auth.signUp.password.short;
      if (values.password !== values.confirmation) return t.auth.signUp.password.mismatch;
      return null;
    };
    return (
      <StepLayout title={t.auth.signUp.password.title} help={t.auth.signUp.password.help} step={index} total={TOTAL} primaryLabel={t.common.continue}
        onPrimary={() => { const problem = validate(); setError(problem); if (!problem) next(); }}>
        <TextField label={t.auth.signUp.password.label} value={values.password} onChangeText={(v) => set("password", v)} secureTextEntry autoComplete="new-password" textContentType="newPassword" autoFocus hint={strength.label ? `Força: ${strength.label}` : undefined} />
        <TextField label={t.auth.signUp.password.confirmation} value={values.confirmation} onChangeText={(v) => set("confirmation", v)} secureTextEntry autoComplete="new-password" error={error} />
      </StepLayout>
    );
  }

  const submit = async () => {
    if (!values.acceptTerms || !values.acceptPrivacy) {
      setError(t.auth.signUp.terms.required);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        cpf: onlyDigits(values.cpf),
        email: normalizeEmail(values.email),
        password: values.password,
        password_confirmation: values.confirmation,
        accept_terms: true,
        accept_privacy: true,
      });
      const email = normalizeEmail(values.email);
      reset();
      router.replace({ pathname: "/check-email", params: { email } });
    } catch (failure) {
      setError(errorMessage(failure, t.common.unexpected));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepLayout title={t.auth.signUp.terms.title} help={t.auth.signUp.terms.help} step={index} total={TOTAL} primaryLabel={t.auth.signUp.terms.submit} onPrimary={submit} primaryLoading={submitting}>
      <ConsentRow label={t.auth.signUp.terms.terms} accepted={values.acceptTerms} onToggle={(v) => set("acceptTerms", v)} onRead={() => router.push({ pathname: "/legal/[kind]", params: { kind: "terms" } })} />
      <ConsentRow label={t.auth.signUp.terms.privacy} accepted={values.acceptPrivacy} onToggle={(v) => set("acceptPrivacy", v)} onRead={() => router.push({ pathname: "/legal/[kind]", params: { kind: "privacy" } })} />
      {error ? <Text tone="error" accessibilityRole="alert">{error}</Text> : null}
    </StepLayout>
  );
}

function ConsentRow({ label, accepted, onToggle, onRead }: { label: string; accepted: boolean; onToggle: (value: boolean) => void; onRead: () => void }) {
  return (
    <View style={styles.consent}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} accessibilityLabel={`${t.auth.signUp.terms.accept} ${label}`} onPress={() => onToggle(!accepted)} style={styles.checkRow}>
        <View style={[styles.box, accepted ? styles.boxOn : null]}>{accepted ? <Text variant="label">✓</Text> : null}</View>
        <Text style={styles.flex}>{t.auth.signUp.terms.accept} {label}</Text>
      </Pressable>
      <Button label={`Ler: ${label}`} variant="ghost" onPress={onRead} />
    </View>
  );
}

const styles = StyleSheet.create({
  consent: { gap: space[1], borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: space[3] },
  checkRow: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: space[3] },
  box: { width: 24, height: 24, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  flex: { flex: 1 },
});
