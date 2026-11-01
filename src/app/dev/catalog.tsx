import { Redirect } from "expo-router";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Progress } from "@/ui/Progress";
import { Screen } from "@/ui/Screen";
import { Sheet } from "@/ui/Sheet";
import { SkeletonCard } from "@/ui/Skeleton";
import { EmptyState, ErrorState } from "@/ui/States";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { useToast } from "@/ui/toast/ToastProvider";

/** Catálogo do design system (só em desenvolvimento): todos os componentes e estados num lugar, para revisar contraste, toque e fonte grande. */
export default function Catalog() {
  const toast = useToast();
  const [text, setText] = useState("");
  const [chip, setChip] = useState(true);
  const [sheet, setSheet] = useState(false);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <Text variant="display">Catálogo</Text>

      <Surface>
        <Text variant="label" tone="textMuted">Tipografia</Text>
        <Text variant="title">Título · Sora</Text>
        <Text variant="heading">Subtítulo</Text>
        <Text>Texto corrido em Manrope, com acentuação: ação, coração, órgão.</Text>
        <Text variant="bodyStrong">Texto em destaque</Text>
        <Text variant="caption" tone="textMuted">Legenda de apoio</Text>
      </Surface>

      <Surface>
        <Text variant="label" tone="textMuted">Botões</Text>
        <Button label="Principal" onPress={() => undefined} />
        <Button label="Secundário" variant="secondary" onPress={() => undefined} />
        <Button label="Discreto" variant="ghost" onPress={() => undefined} />
        <Button label="Perigoso" variant="danger" onPress={() => undefined} />
        <Button label="Carregando" loading onPress={() => undefined} />
        <Button label="Desativado" disabled onPress={() => undefined} />
        <Chip label="Chip marcado" selected={chip} onPress={() => setChip((value) => !value)} />
      </Surface>

      <Surface>
        <Text variant="label" tone="textMuted">Campos</Text>
        <TextField label="Normal" value={text} onChangeText={setText} hint="Texto de ajuda" />
        <TextField label="Com erro" value="" onChangeText={() => undefined} error="Mensagem de erro" />
        <Progress current={2} total={5} />
      </Surface>

      <Surface>
        <Text variant="label" tone="textMuted">Avisos</Text>
        <Button label="Aviso de sucesso" variant="secondary" onPress={() => toast.show("Tudo certo!", "success")} />
        <Button label="Aviso de erro" variant="secondary" onPress={() => toast.show("Algo não funcionou.", "error")} />
        <Button label="Ação com Desfazer" variant="secondary" onPress={() => toast.undoable({ message: "Ação feita", revert: () => undefined, commit: () => undefined })} />
        <Button label="Abrir folha inferior" variant="secondary" onPress={() => setSheet(true)} />
      </Surface>

      <SkeletonCard />
      <EmptyState title="Estado vazio" message="Mensagem que explica o que fazer em seguida." actionLabel="Ação" onAction={() => undefined} />
      <ErrorState message="Mensagem de erro de exemplo." onRetry={() => undefined} />

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Folha inferior">
        <Text>Arraste para baixo ou toque em Fechar.</Text>
      </Sheet>
    </Screen>
  );
}
