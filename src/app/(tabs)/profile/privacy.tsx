import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { deleteAccount, exportAccountData, getConsents, getEmailPreferences, revokeConsent, updateEmailPreferences } from "@/api/account";
import type { EmailPreferences, Legal } from "@/api/dto";
import { errorMessage } from "@/api/errors";
import { useSession } from "@/features/session/SessionProvider";
import { shareTextFile } from "@/lib/shareFile";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { Sheet } from "@/ui/Sheet";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { colors, space } from "@/ui/tokens";
import { useToast } from "@/ui/toast/ToastProvider";
import { t } from "@/i18n/pt-BR";
import { useOnline } from "@/hooks/useOnline";

const CATEGORIES: { key: EmailPreferences.Category; title: string; help: string }[] = [
  { key: "opportunities", ...t.privacy.opportunities },
  { key: "birthday", ...t.privacy.birthday },
  { key: "digest", ...t.privacy.digest },
];

const CONSENT_TITLES: Record<Legal.Kind, string> = t.consent.docs;

const CONFIRM_WORD = "EXCLUIR";

/** Preferências de e-mail, cópia dos dados (LGPD), consentimentos e exclusão da conta (ação irreversível, nunca por gesto). */
export default function Privacy() {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const queryClient = useQueryClient();
  const { signOut } = useSession();
  const preferences = useQuery({ queryKey: ["email-preferences"], queryFn: getEmailPreferences });
  const consents = useQuery({ queryKey: ["consents"], queryFn: getConsents });
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle(key: EmailPreferences.Category, value: boolean) {
    const previous = preferences.data;
    queryClient.setQueryData(["email-preferences"], { preferences: { ...previous?.preferences, [key]: value } });
    try {
      const result = await updateEmailPreferences({ [key]: value });
      queryClient.setQueryData(["email-preferences"], result);
    } catch (error) {
      queryClient.setQueryData(["email-preferences"], previous);
      toast.show(errorMessage(error), "error");
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const data = await exportAccountData();
      const shared = await shareTextFile("profyla-meus-dados.json", JSON.stringify(data, null, 2), "application/json", "Meus dados do Profyla");
      if (!shared) toast.show(t.privacy.shareUnavailable, "error");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setExporting(false);
    }
  }

  async function revoke(kind: Legal.Kind) {
    try {
      await revokeConsent(kind);
      await queryClient.invalidateQueries({ queryKey: ["consents"] });
      toast.show(t.privacy.revoked, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    }
  }

  async function removeAccount() {
    setBusy(true);
    try {
      toast.flushUndo();
      await deleteAccount(password);
      setOpen(false);
      await signOut().catch(() => undefined);
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button label={t.common.back} variant="secondary" onPress={() => router.back()} fullWidth />}>
      <Text variant="title" accessibilityRole="header">{t.privacy.title}</Text>

      <Surface>
        <Text variant="heading">{t.privacy.emails}</Text>
        {CATEGORIES.map((category) => {
          const value = preferences.data?.preferences[category.key] ?? true;
          return (
            <View key={category.key} style={styles.switchRow}>
              <View style={styles.grow}>
                <Text variant="bodyStrong">{category.title}</Text>
                <Text variant="caption" tone="textMuted">{category.help}</Text>
              </View>
              <Switch
                accessibilityLabel={category.title}
                value={value}
                disabled={!preferences.data}
                onValueChange={(next) => void toggle(category.key, next)}
                trackColor={{ true: colors.brand, false: colors.borderStrong }}
              />
            </View>
          );
        })}
      </Surface>

      <Surface>
        <Text variant="heading">{t.privacy.consents}</Text>
        {(consents.data?.documents ?? []).map((item) => (
          <View key={item.kind} style={styles.switchRow}>
            <View style={styles.grow}>
              <Text variant="bodyStrong">{CONSENT_TITLES[item.kind]}</Text>
              <Text variant="caption" tone="textMuted">{item.accepted ? t.privacy.accepted : t.privacy.notAccepted}</Text>
            </View>
            {item.accepted && item.kind === "assessment_notice" ? <Button label={t.privacy.revoke} variant="ghost" accessibilityLabel={`Revogar ${CONSENT_TITLES[item.kind]}`} onPress={() => void revoke(item.kind)} /> : null}
          </View>
        ))}
        <Text variant="caption" tone="textMuted">{t.privacy.consentNote}</Text>
      </Surface>

      <Surface>
        <Text variant="heading">{t.privacy.data}</Text>
        <Text tone="textMuted">{t.privacy.dataHelp}</Text>
        <Button label={t.privacy.export} variant="secondary" disabled={!online} loading={exporting} onPress={() => void exportData()} fullWidth />
      </Surface>

      <Surface>
        <Text variant="heading">{t.privacy.deleteTitle}</Text>
        <Text tone="textMuted">{t.privacy.deleteHelp}</Text>
        <Button label={t.privacy.delete} variant="danger" onPress={() => { setTyped(""); setPassword(""); setOpen(true); }} fullWidth />
      </Surface>

      <Sheet visible={open} onClose={() => setOpen(false)} title={t.privacy.deleteSheet} closeLabel={t.common.cancel}>
        <Text>{t.privacy.deleteInstruction(CONFIRM_WORD)}</Text>
        <TextField label={t.privacy.typeWord(CONFIRM_WORD)} value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} />
        <TextField label={t.privacy.password} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
        <Button label={t.privacy.deleteForever} variant="danger" disabled={!online || typed.trim() !== CONFIRM_WORD || !password} loading={busy} onPress={() => void removeAccount()} fullWidth />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({ switchRow: { flexDirection: "row", alignItems: "center", gap: space[3], paddingVertical: space[2] }, grow: { flex: 1 } });
