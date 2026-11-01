import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useSession } from "@/features/session/SessionProvider";
import { KEYS, writeJson } from "@/lib/localStore";
import { Button } from "@/ui/Button";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { MIN_TOUCH, space } from "@/ui/tokens";

/** Primeira pergunta do app: como a pessoa prefere montar o perfil (plano, 7.2). */
export default function Start() {
  const router = useRouter();
  const { user, signOut } = useSession();

  async function choose(startWith: "pdf" | "questions") {
    await writeJson(KEYS.onboardingDraft, { startWith });
    router.push("/about-you");
  }

  return (
    <StepLayout title={`Olá${user?.name ? `, ${user.name.split(" ")[0]}` : ""}!`} help="Como você prefere montar o seu perfil?" onBack={null} secondaryLabel="Sair da conta" onSecondary={() => void signOut()}>
      <Choice title="Tenho currículo em PDF" subtitle="Você envia o arquivo e revisa o que encontramos. Antes, só uns dados rápidos." onPress={() => void choose("pdf")} />
      <Choice title="Vou responder umas perguntas" subtitle="Uma pergunta por vez, tocando nas respostas. Leva uns 2 minutos." onPress={() => void choose("questions")} />
      <Button label="Por que perguntamos isso?" variant="ghost" onPress={() => router.push({ pathname: "/legal/[kind]", params: { kind: "privacy" } })} />
    </StepLayout>
  );
}

function Choice({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={onPress} style={styles.pressable}>
      <Surface>
        <Text variant="heading">{title}</Text>
        <Text tone="textMuted">{subtitle}</Text>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({ pressable: { minHeight: MIN_TOUCH, marginBottom: space[1] } });
