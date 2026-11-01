import { StyleSheet, View } from "react-native";
import { SCALE_LABELS, SCALE_ORDER, type ScaleAnswer } from "@/gestures/decide";
import { Button } from "@/ui/Button";
import { space } from "@/ui/tokens";

/**
 * Os cinco botões da escala, sempre visíveis: para quem usa leitor de tela são o caminho principal, e para
 * todos são o equivalente exato do arrasto (D-M10).
 */
export function ScaleButtons({ onAnswer, selected }: { onAnswer: (answer: ScaleAnswer) => void; selected?: ScaleAnswer }) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Escala de concordância">
      {SCALE_ORDER.slice().reverse().map((answer) => (
        <Button key={answer} label={SCALE_LABELS[answer]} variant={selected === answer ? "primary" : "secondary"} onPress={() => onAnswer(answer)} fullWidth />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space[2] } });
