import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { FieldSpec, Values } from "@/features/microflow/types";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { Surface } from "@/ui/Surface";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { space } from "@/ui/tokens";

type Props = {
  title: string;
  help?: string;
  fields: FieldSpec[];
  submitLabel: string;
  /** Como o item aparece na lista depois de adicionado. */
  describe: (values: Values) => { title: string; subtitle?: string };
  create: (values: Values) => Promise<void>;
  addAnotherLabel: string;
  continueLabel: string;
  /** Pular o bloco inteiro antes de adicionar o primeiro item. */
  skipLabel: string;
  onNext: () => void;
};

/**
 * Bloco opcional do onboarding (experiência, formação): abre direto no primeiro item, mostra o que já foi
 * adicionado e deixa adicionar outro ou seguir. Pular o bloco vale o mesmo que concluir (plano, 7.2).
 */
export function AddListFlow({ title, help, fields, submitLabel, describe, create, addAnotherLabel, continueLabel, skipLabel, onNext }: Props) {
  const [items, setItems] = useState<{ title: string; subtitle?: string }[]>([]);
  const [adding, setAdding] = useState(true);

  if (adding) {
    return (
      <MicroFlow
        key={items.length}
        fields={fields}
        submitLabel={submitLabel}
        onComplete={async (values) => {
          await create(values);
          setItems((current) => [...current, describe(values)]);
          setAdding(false);
        }}
        onExit={items.length > 0 ? () => setAdding(false) : undefined}
        topSecondary={items.length === 0 ? { label: skipLabel, onPress: onNext } : undefined}
      />
    );
  }

  return (
    <StepLayout title={title} help={help} onBack={null} primaryLabel={continueLabel} onPrimary={onNext} secondaryLabel={addAnotherLabel} onSecondary={() => setAdding(true)}>
      <View style={styles.list}>
        {items.map((item, index) => (
          <Surface key={`${item.title}-${index}`}>
            <Text variant="bodyStrong">{item.title}</Text>
            {item.subtitle ? <Text tone="textMuted">{item.subtitle}</Text> : null}
          </Surface>
        ))}
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({ list: { gap: space[3] } });
