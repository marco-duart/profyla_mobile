import { useState } from "react";
import { ScrollView, View } from "react-native";
import { MonthYearField } from "@/features/microflow/fields/MonthYearField";
import { Button } from "@/ui/Button";
import { Sheet } from "@/ui/Sheet";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { space } from "@/ui/tokens";
import { type Data, type ItemCard, type ListKind, missingRequired } from "./reviewModel";

type FieldDef = { name: string; label: string; kind: "text" | "month" | "multiline"; clearable?: boolean };

const FIELDS: Record<ListKind, FieldDef[]> = {
  employment: [
    { name: "company_name", label: "Empresa", kind: "text" },
    { name: "position", label: "Cargo", kind: "text" },
    { name: "start_date", label: "Início", kind: "month" },
    { name: "end_date", label: "Término (vazio = emprego atual)", kind: "month", clearable: true },
    { name: "achievements", label: "Realizações", kind: "multiline" },
  ],
  academic: [
    { name: "title", label: "Curso", kind: "text" },
    { name: "institution", label: "Instituição", kind: "text" },
    { name: "degree", label: "Grau", kind: "text" },
    { name: "start_date", label: "Início", kind: "month" },
    { name: "end_date", label: "Conclusão", kind: "month", clearable: true },
  ],
  professional: [{ name: "title", label: "Título", kind: "text" }, { name: "link", label: "Endereço", kind: "text" }],
  social: [{ name: "title", label: "Título", kind: "text" }, { name: "link", label: "Endereço", kind: "text" }],
};

const toMonth = (iso: string | null) => (iso ? iso.slice(0, 7) : null);
const fromMonth = (month: string) => `${month}-01`;

type Props = {
  card: ItemCard | null;
  errors?: Record<string, string[]>;
  onSave: (data: Data) => void;
  onClose: () => void;
};

/** Edita um item da revisão. Datas por mês/ano (sem teclado); o que falta fica destacado e trava o "Adicionar". */
export function ItemEditSheet({ card, errors, onSave, onClose }: Props) {
  return (
    <Sheet visible={Boolean(card)} onClose={onClose} title="Editar item" closeLabel="Cancelar">
      {card ? <Form key={card.key} card={card} errors={errors} onSave={onSave} /> : null}
    </Sheet>
  );
}

function Form({ card, errors, onSave }: { card: ItemCard; errors?: Record<string, string[]>; onSave: (data: Data) => void }) {
  const [data, setData] = useState<Data>(card.data);
  const missing = new Set(missingRequired(card.list, data));
  const set = (name: string, value: string | null) => setData((current) => ({ ...current, [name]: value }));

  return (
    <View style={{ gap: space[3], flexShrink: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }} contentContainerStyle={{ gap: space[3] }}>
        {FIELDS[card.list].map((field) => {
          const error = errors?.[field.name]?.[0] ?? (missing.has(field.name) ? "Informe para poder adicionar." : null);
          if (field.kind === "month") {
            return (
              <View key={field.name} style={{ gap: space[2] }}>
                <MonthYearField label={field.label} value={toMonth(data[field.name])} onChange={(month) => set(field.name, fromMonth(month))} error={error} />
                {field.clearable && data[field.name] ? <Button label="Sem data de término" variant="ghost" onPress={() => set(field.name, null)} /> : null}
              </View>
            );
          }
          return <TextField key={field.name} label={field.label} value={data[field.name] ?? ""} onChangeText={(value) => set(field.name, value)} error={error} multiline={field.kind === "multiline"} autoCapitalize={field.name === "link" ? "none" : "sentences"} />;
        })}
        {card.warnings.includes("year_only") ? <Text variant="caption" tone="textMuted">Confira o mês: o currículo informa só o ano.</Text> : null}
      </ScrollView>
      <Button label="Salvar" onPress={() => onSave(data)} fullWidth />
    </View>
  );
}
