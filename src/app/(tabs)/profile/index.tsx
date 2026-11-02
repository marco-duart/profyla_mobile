import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { deletePhoto, getAccount, uploadPhoto } from "@/api/account";
import { errorMessage } from "@/api/errors";
import { deleteAcademic, deleteEmployment, removeKnowledge, removeSkill } from "@/api/profile";
import { useCurriculum } from "@/features/profile/useCurriculum";
import { useSession } from "@/features/session/SessionProvider";
import { formatDate, formatMonthYear } from "@/lib/format";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Screen } from "@/ui/Screen";
import { Sheet } from "@/ui/Sheet";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { Surface } from "@/ui/Surface";
import { TabHeader } from "@/ui/TabHeader";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";
import { useToast } from "@/ui/toast/ToastProvider";
import { t } from "@/i18n/pt-BR";
import { useOnline } from "@/hooks/useOnline";

type Removal = { label: string; run: () => Promise<void> };

/** Perfil: resumo do currículo, atalhos de edição e a conta. Editar = adicionar ou remover itens (o servidor não edita o perfil base). */
export default function Profile() {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const queryClient = useQueryClient();
  const { signOut } = useSession();
  const account = useQuery({ queryKey: ["account"], queryFn: getAccount });
  const curriculum = useCurriculum();
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["curriculum"] });

  async function confirmRemoval() {
    if (!removal) return;
    setBusy(true);
    try {
      await removal.run();
      await refresh();
      setRemoval(null);
      toast.show(t.profile.removed, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function changePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show(t.profile.photoDenied, "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      await uploadPhoto({ uri: asset.uri, name: asset.fileName ?? "foto.jpg", mimeType: asset.mimeType ?? "image/jpeg" });
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.show(t.profile.photoUpdated, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    }
  }

  async function removePhoto() {
    try {
      await deletePhoto();
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.show(t.profile.photoRemoved, "success");
    } catch (error) {
      toast.show(errorMessage(error), "error");
    }
  }

  async function leave() {
    setLeaving(true);
    toast.flushUndo();
    try {
      await signOut();
    } catch (error) {
      toast.show(errorMessage(error), "error");
      setLeaving(false);
    }
  }

  const data = curriculum.data;
  const profile = data?.candidate_profile;

  return (
    <Screen insideTabs>
      <TabHeader title={t.profile.title} />

      <Surface>
        <View style={styles.identity}>
          {account.data?.photo_url ? (
            <Image source={{ uri: account.data.photo_url }} style={styles.photo} accessibilityLabel="Sua foto" />
          ) : (
            <View style={[styles.photo, styles.photoEmpty]} accessibilityLabel={t.profile.noPhoto}>
              <Text variant="title">{(account.data?.name ?? "?").slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.grow}>
            <Text variant="heading">{account.data?.name ?? "..."}</Text>
            <Text tone="textMuted">{account.data?.email}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Button label={account.data?.photo_url ? t.profile.changePhoto : t.profile.addPhoto} variant="secondary" onPress={() => void changePhoto()} style={styles.grow} />
          {account.data?.photo_url ? <Button label={t.profile.removePhoto} variant="ghost" onPress={() => void removePhoto()} /> : null}
        </View>
      </Surface>

      {curriculum.isPending ? <SkeletonCard /> : null}
      {curriculum.isError ? <ErrorState message={errorMessage(curriculum.error)} onRetry={() => void curriculum.refetch()} /> : null}

      {data ? (
        <>
          <Surface>
            <Text variant="heading">{t.profile.about}</Text>
            {profile ? (
              <>
                {profile.resume ? <Text>{profile.resume}</Text> : null}
                <Text tone="textMuted">{[profile.address_neighborhood, profile.address_city].filter(Boolean).join(" · ")}</Text>
                {profile.birthdate ? <Text tone="textMuted">Nascimento: {formatDate(profile.birthdate)}</Text> : null}
                {profile.phone_number1 ? <Text tone="textMuted">Celular: {profile.phone_number1}</Text> : null}
              </>
            ) : (
              <Text tone="textMuted">{t.profile.noProfile}</Text>
            )}
          </Surface>

          <Surface>
            <Text variant="heading">{t.profile.experiences}</Text>
            {data.employment_histories.length === 0 ? <Text tone="textMuted">{t.profile.noExperiences}</Text> : null}
            {data.employment_histories.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.grow}>
                  <Text variant="bodyStrong">{item.position}</Text>
                  <Text tone="textMuted">{item.company_name}</Text>
                  <Text variant="caption" tone="textFaint">
                    {formatMonthYear(item.start_date)} – {item.end_date ? formatMonthYear(item.end_date) : t.profile.present}
                  </Text>
                </View>
                <Button label={t.profile.remove} variant="ghost" accessibilityLabel={`Remover experiência ${item.position}`} onPress={() => setRemoval({ label: `a experiência "${item.position}"`, run: async () => void (await deleteEmployment(item.id)) })} />
              </View>
            ))}
            <Button label={t.profile.addExperience} variant="secondary" onPress={() => router.push("/profile/add-experience")} />
          </Surface>

          <Surface>
            <Text variant="heading">{t.profile.education}</Text>
            {data.academic_histories.length === 0 ? <Text tone="textMuted">{t.profile.noEducation}</Text> : null}
            {data.academic_histories.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.grow}>
                  <Text variant="bodyStrong">{item.title}</Text>
                  <Text tone="textMuted">{item.institution}</Text>
                  <Text variant="caption" tone="textFaint">
                    {formatMonthYear(item.start_date)} – {item.end_date ? formatMonthYear(item.end_date) : t.profile.studying}
                  </Text>
                </View>
                <Button label={t.profile.remove} variant="ghost" accessibilityLabel={`Remover formação ${item.title}`} onPress={() => setRemoval({ label: `a formação "${item.title}"`, run: async () => void (await deleteAcademic(item.id)) })} />
              </View>
            ))}
            <Button label={t.profile.addEducation} variant="secondary" onPress={() => router.push("/profile/add-education")} />
          </Surface>

          <Surface>
            <Text variant="heading">{t.profile.skills}</Text>
            <View style={styles.chips}>
              {data.skills.map((item) => (
                <Chip key={`s${item.id}`} label={`${item.title} ✕`} onPress={() => setRemoval({ label: `a habilidade "${item.title}"`, run: async () => void (await removeSkill(item.id)) })} />
              ))}
              {data.knowledges.map((item) => (
                <Chip key={`k${item.id}`} label={`${item.title} ✕`} onPress={() => setRemoval({ label: `o conhecimento "${item.title}"`, run: async () => void (await removeKnowledge(item.id)) })} />
              ))}
            </View>
            {data.skills.length + data.knowledges.length === 0 ? <Text tone="textMuted">{t.profile.noSkills}</Text> : <Text variant="caption" tone="textFaint">{t.profile.tapToRemove}</Text>}
            <Button label={t.profile.markSkills} variant="secondary" onPress={() => router.push("/profile/skills")} />
          </Surface>

          <Surface>
            <Text variant="heading">{t.profile.pdf}</Text>
            <Text tone="textMuted">{data.curriculum_file ? data.curriculum_file.filename : t.profile.noPdf}</Text>
            <Button label={data.curriculum_file ? t.profile.importFromPdf : t.profile.uploadAndImport} variant="secondary" onPress={() => router.push("/import/pick")} />
          </Surface>
        </>
      ) : null}

      <Surface>
        <Text variant="heading">{t.profile.account}</Text>
        <Button label={t.profile.accountData} variant="secondary" onPress={() => router.push("/profile/account")} />
        <Button label={t.profile.privacy} variant="secondary" onPress={() => router.push("/profile/privacy")} />
        <Button label={t.profile.dismissed} variant="secondary" onPress={() => router.push("/profile/dismissed")} />
        <Button label={t.profile.novidades} variant="secondary" onPress={() => router.push("/novidades")} />
        <Button label={t.profile.terms} variant="ghost" onPress={() => router.push({ pathname: "/legal/[kind]", params: { kind: "terms" } })} />
        <Button label={t.profile.privacyPolicy} variant="ghost" onPress={() => router.push({ pathname: "/legal/[kind]", params: { kind: "privacy" } })} />
      </Surface>

      <Button label={t.profile.signOut} variant="danger" loading={leaving} onPress={() => void leave()} fullWidth />

      <Sheet visible={removal !== null} onClose={() => setRemoval(null)} title={t.profile.removeTitle} closeLabel={t.common.cancel}>
        <Text>Você vai remover {removal?.label}. Dá para adicionar de novo depois.</Text>
        <Button label={t.profile.removeConfirm} variant="danger" disabled={!online} loading={busy} onPress={() => void confirmRemoval()} fullWidth />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: space[4], marginBottom: space[3] },
  photo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceStrong },
  photoEmpty: { alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  row: { flexDirection: "row", gap: space[2], alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: space[2], paddingVertical: space[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
