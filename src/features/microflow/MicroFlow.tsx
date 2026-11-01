import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { errorMessage } from "@/api/errors";
import type { Place } from "@/data/places";
import { readJson, removeKey, writeJson } from "@/lib/localStore";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { StepLayout } from "@/ui/StepLayout";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { colors, MIN_TOUCH, space } from "@/ui/tokens";
import { DateField } from "./fields/DateField";
import { MonthYearField } from "./fields/MonthYearField";
import { PlaceField } from "./fields/PlaceField";
import { clampIndex, pruneHidden, validateField, visibleFields } from "./flow";
import { type FieldSpec, type Values } from "./types";

type Props = {
  fields: FieldSpec[];
  initial?: Values;
  /** Chave de armazenamento local: o progresso é salvo a cada passo e retomado ao reabrir. */
  persistKey?: string;
  /** Texto do botão do último passo. */
  submitLabel?: string;
  onComplete: (values: Values) => Promise<void> | void;
  /** Voltar no primeiro passo. */
  onExit?: () => void;
  /** Ação extra no primeiro passo (ex.: "Pular tudo"). */
  topSecondary?: { label: string; onPress: () => void };
};

type Saved = { values: Values; index: number };

/**
 * Um campo por tela, com o controle certo para cada dado, progresso salvo e voltar por passo.
 * É a base do onboarding, da edição do perfil por seção e dos blocos de experiência e formação.
 */
export function MicroFlow({ fields, initial, persistKey, submitLabel = "Concluir", onComplete, onExit, topSecondary }: Props) {
  const [values, setValues] = useState<Values>(initial ?? {});
  const [index, setIndex] = useState(0);
  const [restored, setRestored] = useState(!persistKey);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const advancing = useRef(false);

  const visible = useMemo(() => visibleFields(fields, values), [fields, values]);
  const position = clampIndex(index, visible.length);
  const field = visible[position];
  const last = position === visible.length - 1;

  // Retoma de onde parou.
  useEffect(() => {
    if (!persistKey) return;
    let active = true;
    readJson<Saved | null>(persistKey, null).then((saved) => {
      if (!active) return;
      if (saved) {
        setValues({ ...(initial ?? {}), ...saved.values });
        setIndex(saved.index);
      }
      setRestored(true);
    });
    return () => {
      active = false;
    };
    // initial é só o ponto de partida; o progresso salvo manda depois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  useEffect(() => {
    if (!persistKey || !restored) return;
    const handle = setTimeout(() => void writeJson(persistKey, { values, index } satisfies Saved), 300);
    return () => clearTimeout(handle);
  }, [persistKey, restored, values, index]);

  const goBack = useCallback(() => {
    setError(null);
    if (position > 0) setIndex(position - 1);
    else onExit?.();
  }, [position, onExit]);

  // Botão voltar do Android: volta um passo antes de sair do fluxo.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (position > 0) {
          setIndex(position - 1);
          return true;
        }
        if (onExit) {
          onExit();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [position, onExit]),
  );

  const advance = useCallback(
    async (next: Values) => {
      if (!field || advancing.current) return;
      const problem = validateField(field, next);
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      const cleaned = pruneHidden(fields, next);
      // O que falta depende da resposta que acabou de entrar (ex.: "Não, já saí" abre o passo da data de saída).
      const isLast = position >= visibleFields(fields, cleaned).length - 1;
      if (!isLast) {
        setValues(cleaned);
        setIndex(position + 1);
        return;
      }
      advancing.current = true;
      setBusy(true);
      try {
        await onComplete(cleaned);
        if (persistKey) await removeKey(persistKey);
      } catch (failure) {
        setError(errorMessage(failure));
      } finally {
        advancing.current = false;
        setBusy(false);
      }
    },
    [field, fields, onComplete, persistKey, position],
  );

  if (!restored || !field) return null;

  const setValue = (value: unknown) => {
    setError(null);
    setValues((current) => ({ ...current, [field.key]: value }));
  };
  const value = values[field.key];

  return (
    <StepLayout
      title={field.title}
      help={field.help}
      step={position + 1}
      total={visible.length}
      onBack={onExit || position > 0 ? goBack : null}
      primaryLabel={last ? submitLabel : "Continuar"}
      onPrimary={() => void advance(values)}
      primaryLoading={busy}
      secondaryLabel={field.optional ? (field.skipLabel ?? "Pular") : position === 0 ? topSecondary?.label : undefined}
      onSecondary={field.optional ? () => void advance({ ...values, [field.key]: undefined }) : topSecondary?.onPress}
    >
      <FieldControl field={field} value={value} values={values} error={error} onChange={setValue} onSubmit={() => void advance(values)} onPick={(picked) => { setValues((current) => ({ ...current, [field.key]: picked })); void advance({ ...values, [field.key]: picked }); }} />
      {field.shortcut ? (
        <Button
          label={field.shortcut.label}
          variant="secondary"
          onPress={() => {
            void (async () => {
              try {
                const applied = await field.shortcut?.apply(values);
                if (applied === undefined || applied === null) return;
                setValues((current) => ({ ...current, [field.key]: applied }));
                await advance({ ...values, [field.key]: applied });
              } catch (failure) {
                setError(errorMessage(failure));
              }
            })();
          }}
        />
      ) : null}
    </StepLayout>
  );
}

type ControlProps = {
  field: FieldSpec;
  value: unknown;
  values: Values;
  error: string | null;
  onChange: (value: unknown) => void;
  onSubmit: () => void;
  /** Escolha de um toque: grava e já avança. */
  onPick: (value: unknown) => void;
};

function FieldControl({ field, value, values, error, onChange, onSubmit, onPick }: ControlProps) {
  switch (field.kind) {
    case "choice":
      return (
        <View style={styles.choices} accessibilityRole="radiogroup">
          {field.options?.map((option) => (
            <ChoiceCard key={String(option.value)} label={option.label} selected={value === option.value} onPress={() => (field.autoAdvance === false ? onChange(option.value) : onPick(option.value))} />
          ))}
          {error ? <Text variant="caption" tone="error" accessibilityRole="alert">{error}</Text> : null}
        </View>
      );
    case "date":
      return <DateField label={field.label ?? field.title} value={(value as string) ?? null} onChange={onChange} maximumDate={field.maximumDate?.()} minimumDate={field.minimumDate?.()} error={error} />;
    case "monthYear":
      return <MonthYearField label={field.label ?? field.title} value={(value as string) ?? null} onChange={onChange} error={error} />;
    case "place":
      return <PlaceField label={field.label ?? field.title} value={(value as Place) ?? null} onChange={onChange} error={error} />;
    case "multiline": {
      const text = (value as string) ?? "";
      return (
        <View style={styles.choices}>
          <TextField label={field.label ?? field.title} value={text} onChangeText={onChange} multiline maxLength={field.maxLength} error={error} placeholder={field.placeholder} hint={field.maxLength ? `${text.length}/${field.maxLength} caracteres` : undefined} />
          {field.starters?.(values).map((starter) => <Chip key={starter} label={starter} onPress={() => onChange(starter)} />)}
        </View>
      );
    }
    default:
      return (
        <View style={styles.choices}>
          <TextField label={field.label ?? field.title} value={(value as string) ?? ""} onChangeText={onChange} format={field.mask} keyboardType={field.keyboardType} autoCapitalize={field.autoCapitalize ?? "sentences"} placeholder={field.placeholder} maxLength={field.maxLength} error={error} autoFocus returnKeyType="next" onSubmitEditing={onSubmit} />
          {field.suggestions?.length ? (
            <View style={styles.chips}>
              {field.suggestions.map((suggestion) => <Chip key={suggestion} label={suggestion} selected={value === suggestion} onPress={() => onChange(suggestion)} />)}
            </View>
          ) : null}
        </View>
      );
  }
}

function ChoiceCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Chip label={label} selected={selected} onPress={onPress} />;
}

const styles = StyleSheet.create({
  choices: { gap: space[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});

export const microflowCard = { minHeight: MIN_TOUCH, borderColor: colors.border };
