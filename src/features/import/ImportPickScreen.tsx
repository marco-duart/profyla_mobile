import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { getImportDraft, uploadCurriculumFile } from "@/api/profile";
import { ApiError, toApiError } from "@/api/errors";
import { importStore } from "./importStore";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/tokens";

const MAX_BYTES = 5 * 1024 * 1024;
const STAGES = ["Lendo o seu PDF...", "Separando as experiências...", "Procurando a formação...", "Encontrando links e habilidades..."];

type Props = {
  /** O rascunho está pronto: abrir a revisão. */
  onReview: () => void;
  /** PDF ilegível ou sem arquivo: seguir pelas perguntas, sem beco sem saída (plano, 7.3). */
  onFallback: () => void;
  onBack?: () => void;
  /** Já existe PDF anexado: oferecer ler o que está lá, sem enviar de novo. */
  hasExistingFile?: boolean;
};

export function ImportPickScreen({ onReview, onFallback, onBack, hasExistingFile }: Props) {
  const [phase, setPhase] = useState<"idle" | "uploading" | "reading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);

  // Passos animados enquanto o servidor lê o PDF (rápido: costuma levar poucos segundos).
  useEffect(() => {
    if (phase !== "reading") return;
    const timer = setInterval(() => setStage((current) => Math.min(current + 1, STAGES.length - 1)), 1100);
    return () => clearInterval(timer);
  }, [phase]);

  async function read() {
    setPhase("reading");
    setStage(0);
    try {
      importStore.set(await getImportDraft());
      onReview();
    } catch (failure) {
      const apiError = toApiError(failure);
      if (apiError.code === "unreadable_pdf" || apiError.code === "no_curriculum_file") {
        onFallback();
        return;
      }
      setError(apiError.status === 429 ? "Você já importou várias vezes nesta hora. Tente de novo mais tarde ou preencha pelas perguntas." : apiError.message);
      setPhase("idle");
    }
  }

  async function pick() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.mimeType && asset.mimeType !== "application/pdf") {
      setError("O currículo precisa ser um arquivo PDF.");
      return;
    }
    if (asset.size && asset.size > MAX_BYTES) {
      setError("O PDF deve ter no máximo 5 MB.");
      return;
    }
    setPhase("uploading");
    try {
      await uploadCurriculumFile({ uri: asset.uri, name: asset.name || "curriculo.pdf", mimeType: "application/pdf" });
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível enviar o arquivo.");
      setPhase("idle");
      return;
    }
    await read();
  }

  if (phase !== "idle") {
    return (
      <StepLayout title={phase === "uploading" ? "Enviando o arquivo..." : STAGES[stage]} onBack={null}>
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={colors.brand} />
          <Text tone="textMuted" center>Isso leva só alguns segundos. Nada é salvo antes de você revisar.</Text>
        </View>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title="Importar do currículo"
      help="Envie o PDF e revise o que encontramos, um item por vez. Nada é salvo antes de você confirmar."
      onBack={onBack ?? null}
      primaryLabel="Escolher o PDF"
      onPrimary={() => void pick()}
      secondaryLabel="Prefiro responder perguntas"
      onSecondary={onFallback}
    >
      {hasExistingFile ? <Button label="Usar o PDF que já enviei" variant="secondary" onPress={() => void read()} /> : null}
      <Surface>
        <Text tone="textMuted">O arquivo é lido no servidor do Profyla, sem terceiros. Aceitamos PDF com texto, até 5 MB. PDF escaneado (imagem) não é lido.</Text>
      </Surface>
      {error ? <Text tone="error" accessibilityRole="alert">{error}</Text> : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({ center: { alignItems: "center", gap: space[4], paddingTop: space[8] } });
