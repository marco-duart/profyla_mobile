import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAnnounce } from "@/hooks/useAnnounce";
import { Button } from "./Button";
import { Progress } from "./Progress";
import { Screen } from "./Screen";
import { Text } from "./Text";
import { colors, MIN_TOUCH, space } from "./tokens";

type Props = {
  title: string;
  help?: string;
  /** Passo atual (1..total) para a barra de progresso. */
  step?: number;
  total?: number;
  children?: ReactNode;
  /** Ação principal no rodapé. */
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Ação secundária ("Pular", "Agora não"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: (() => void) | null;
  scroll?: boolean;
};

/** Um assunto por tela: título, ajuda curta, o controle e o botão principal fixo embaixo (plano, princípio 1). */
export function StepLayout({ title, help, step, total, children, primaryLabel, onPrimary, primaryDisabled, primaryLoading, secondaryLabel, onSecondary, onBack, scroll = true }: Props) {
  const router = useRouter();
  useAnnounce(title);
  const back = onBack === undefined ? (router.canGoBack() ? () => router.back() : null) : onBack;

  return (
    <Screen
      scroll={scroll}
      footer={
        primaryLabel || secondaryLabel ? (
          <>
            {primaryLabel ? <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} loading={primaryLoading} fullWidth /> : null}
            {secondaryLabel ? <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} fullWidth /> : null}
          </>
        ) : undefined
      }
    >
      <View style={styles.top}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.back}>
            <Text variant="bodyStrong" tone="tint">← Voltar</Text>
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        {step && total ? <Progress current={step} total={total} /> : null}
      </View>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">{title}</Text>
        {help ? <Text tone="textMuted">{help}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: space[2] },
  back: { minHeight: MIN_TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  header: { gap: space[2], paddingTop: space[2] },
  body: { gap: space[4], flex: 1 },
});

export const stepDivider = { height: 1, backgroundColor: colors.border };
