import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { getAccount, updateAccount, updatePassword } from "@/api/account";
import { errorMessage } from "@/api/errors";
import { isValidEmail, MIN_PASSWORD_LENGTH, normalizeEmail } from "@/lib/validation";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { useToast } from "@/ui/toast/ToastProvider";
import { t } from "@/i18n/pt-BR";
import { useOnline } from "@/hooks/useOnline";

/** Nome, e-mail e senha. Trocar o e-mail pede nova confirmação, por isso o aviso depois de salvar. */
export default function AccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const queryClient = useQueryClient();
  const account = useQuery({ queryKey: ["account"], queryFn: getAccount });
  const [draft, setDraft] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [changing, setChanging] = useState(false);

  // O que a pessoa digitou vale; enquanto não digitou, mostra o valor salvo.
  const name = draft.name ?? account.data?.name ?? "";
  const email = draft.email ?? account.data?.email ?? "";
  const setName = (value: string) => setDraft((current) => ({ ...current, name: value }));
  const setEmail = (value: string) => setDraft((current) => ({ ...current, email: value }));

  const emailProblem = email && !isValidEmail(email) ? t.account.invalidEmail : null;
  const dirty = account.data !== undefined && (name.trim() !== account.data.name || normalizeEmail(email) !== account.data.email);
  const passwordProblem = password && password.length < MIN_PASSWORD_LENGTH ? t.account.passwordShort(MIN_PASSWORD_LENGTH) : null;
  const confirmationProblem = confirmation && confirmation !== password ? t.account.passwordMismatch : null;

  async function save() {
    setSaving(true);
    try {
      const result = await updateAccount({ name: name.trim(), email: normalizeEmail(email) });
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      setDraft({});
      toast.show(result.message || t.account.saved, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setChanging(true);
    try {
      const result = await updatePassword({ password, password_confirmation: confirmation });
      setPassword("");
      setConfirmation("");
      toast.show(result.message || t.account.passwordChanged, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setChanging(false);
    }
  }

  return (
    <Screen footer={<Button label={t.common.back} variant="secondary" onPress={() => router.back()} fullWidth />}>
      <Text variant="title" accessibilityRole="header">{t.account.title}</Text>
      <Surface>
        <TextField label={t.account.name} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
        <TextField label={t.account.email} value={email} onChangeText={setEmail} error={emailProblem} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Text variant="caption" tone="textMuted">{t.account.cpf(account.data?.cpf ?? "-")}</Text>
        <Button label={t.account.save} disabled={!online || !dirty || Boolean(emailProblem) || name.trim() === ""} loading={saving} onPress={() => void save()} fullWidth />
      </Surface>

      <Surface>
        <Text variant="heading">{t.account.newPassword}</Text>
        <TextField label={t.account.newPassword} value={password} onChangeText={setPassword} error={passwordProblem} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
        <TextField label={t.account.repeatPassword} value={confirmation} onChangeText={setConfirmation} error={confirmationProblem} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
        <Button label={t.account.changePassword} disabled={!online || !password || Boolean(passwordProblem) || confirmation !== password} loading={changing} onPress={() => void changePassword()} fullWidth />
      </Surface>
    </Screen>
  );
}
