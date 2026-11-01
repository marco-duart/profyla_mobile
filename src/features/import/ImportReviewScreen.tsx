import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { CurriculumImport } from "@/api/dto";
import { toApiError } from "@/api/errors";
import { applyImport } from "@/api/profile";
import { SwipeCard } from "@/gestures/SwipeCard";
import { formatDate, formatMonthYear } from "@/lib/format";
import { maskPhone } from "@/lib/masks";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Progress } from "@/ui/Progress";
import { Screen } from "@/ui/Screen";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";
import { colors, space } from "@/ui/tokens";
import { importStore } from "./importStore";
import { ItemEditSheet } from "./ItemEditSheet";
import {
  type Card, type CatalogCard, type Data, type Decisions, type ItemCard, type ProfileCard,
  buildApplyPayload, buildCards, cardId, initialCatalogSelection, initialDecisions, isConflict, mapDetailsToCards, missingRequired,
} from "./reviewModel";

const PROFILE_LABELS: Record<string, string> = {
  phone_number1: "Celular principal", phone_number2: "Celular secundário", address_city: "Cidade", address_neighborhood: "Bairro",
  birthplace: "Naturalidade", birthdate: "Data de nascimento", employee: "Empregado atualmente", resume: "Resumo profissional",
};

const LIST_TITLE = { employment: "Experiência", academic: "Formação", professional: "Link profissional", social: "Rede social" } as const;

function profileValue(field: string, value: string | boolean | null): string {
  if (value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (field.startsWith("phone")) return maskPhone(value);
  if (field === "birthdate") return formatDate(value);
  return value;
}

function itemLines(card: ItemCard): { title: string; lines: string[] } {
  const d = card.data;
  if (card.list === "employment") {
    const period = `${formatMonthYear(d.start_date)} – ${d.end_date ? formatMonthYear(d.end_date) : "atual"}`;
    return { title: d.position || "Cargo não informado", lines: [d.company_name || "Empresa não informada", period, ...(d.achievements ? [d.achievements.split("\n").slice(0, 3).join("\n")] : [])] };
  }
  if (card.list === "academic") {
    return { title: [d.degree, d.title].filter(Boolean).join(" em ") || "Formação", lines: [d.institution || "Instituição não informada", `${formatMonthYear(d.start_date)} – ${d.end_date ? formatMonthYear(d.end_date) : "em andamento"}`] };
  }
  return { title: d.title || "Link", lines: [d.link || ""] };
}

type Props = {
  /** Depois de aplicar com sucesso. */
  onFinished: () => void;
  /** Sem rascunho em memória ou nada aproveitável. */
  onFallback: () => void;
};

/** Revisão em pilha de cards (plano, 7.3): direita = adicionar, esquerda = não adicionar, tocar = editar. */
export function ImportReviewScreen({ onFinished, onFallback }: Props) {
  const draft = useMemo(() => importStore.get(), []);
  if (!draft) return <NoDraft onFallback={onFallback} />;
  return <Review draft={draft} onFinished={onFinished} onFallback={onFallback} />;
}

function NoDraft({ onFallback }: { onFallback: () => void }) {
  return (
    <StepLayout title="Nada para revisar" onBack={null} primaryLabel="Continuar" onPrimary={onFallback}>
      <Text tone="textMuted">Não encontramos informações que pudéssemos aproveitar. Você pode preencher pelas perguntas.</Text>
    </StepLayout>
  );
}

function Review({ draft, onFinished, onFallback }: { draft: CurriculumImport.Draft; onFinished: () => void; onFallback: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<Card[]>(() => buildCards(draft));
  const [decisions, setDecisions] = useState<Decisions>(() => initialDecisions(buildCards(draft)));
  const [catalog, setCatalog] = useState(() => initialCatalogSelection(buildCards(draft)));
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<ItemCard | null>(null);
  const [errors, setErrors] = useState<Record<string, Record<string, string[]>>>({});
  const [applying, setApplying] = useState(false);

  if (cards.length === 0) return <NoDraft onFallback={onFallback} />;

  const done = index >= cards.length;
  const card = cards[index];
  const built = buildApplyPayload(draft.run_id, cards, decisions, catalog);

  const decide = (decision: "add" | "skip") => {
    if (!card) return;
    setDecisions((current) => ({ ...current, [cardId(card)]: decision }));
    setIndex((current) => current + 1);
  };

  const saveEdit = (data: Data) => {
    if (!editing) return;
    setCards((current) => current.map((item) => (item.type === "item" && item.key === editing.key ? { ...item, data } : item)));
    setErrors((current) => ({ ...current, [editing.key]: {} }));
    setEditing(null);
  };

  async function apply() {
    setApplying(true);
    try {
      await applyImport(built.payload);
      importStore.clear();
      await Promise.all(["curriculum", "home", "account"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      toast.show(`Currículo atualizado com ${built.count} ${built.count === 1 ? "item" : "itens"}.`, "success");
      onFinished();
    } catch (failure) {
      const error = toApiError(failure);
      if (error.code === "validation_error" && error.details) {
        const mapped = mapDetailsToCards(error.details, built.order, PROFILE_LABELS);
        setErrors(mapped.byCard);
        const firstKey = Object.keys(mapped.byCard)[0];
        const target = cards.findIndex((item) => item.type === "item" && item.key === firstKey);
        if (target >= 0) {
          setIndex(target);
          setEditing(cards[target] as ItemCard);
        }
        toast.show(mapped.profile.length ? mapped.profile.join(" ") : "Corrija os itens destacados e tente de novo.", "error");
      } else {
        toast.show(error.message, "error");
      }
    } finally {
      setApplying(false);
    }
  }

  if (done) {
    return (
      <StepLayout
        title={built.count ? `Vamos adicionar ${built.count} ${built.count === 1 ? "item" : "itens"}` : "Nada selecionado"}
        help={built.count ? "Confira o resumo. Você ainda pode voltar e revisar." : "Você não escolheu nenhum item. Pode voltar e revisar ou seguir sem importar."}
        onBack={null}
        primaryLabel={built.count ? "Adicionar ao currículo" : "Continuar sem importar"}
        onPrimary={built.count ? () => void apply() : onFallback}
        primaryLoading={applying}
        secondaryLabel="Voltar e revisar"
        onSecondary={() => setIndex(0)}
      >
        <Summary built={built} />
      </StepLayout>
    );
  }

  return (
    <Screen
      footer={<ReviewActions card={card} decisions={decisions} canGoBack={index > 0} onBack={() => setIndex((current) => Math.max(0, current - 1))} onDecide={decide} onEdit={() => card.type === "item" && setEditing(card)} onCatalogContinue={() => setIndex((current) => current + 1)} />}
    >
      <Progress current={index + 1} total={cards.length} label={`Item ${index + 1} de ${cards.length}`} />
      <CardView key={cardId(card)} card={card} errors={errors[cardId(card)]} catalog={catalog} onCatalog={setCatalog} onDecide={decide} onEdit={() => card.type === "item" && setEditing(card)} />
      <ItemEditSheet card={editing} errors={editing ? errors[editing.key] : undefined} onSave={saveEdit} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function CardView({ card, errors, catalog, onCatalog, onDecide, onEdit }: { card: Card; errors?: Record<string, string[]>; catalog: ReturnType<typeof initialCatalogSelection>; onCatalog: (next: ReturnType<typeof initialCatalogSelection>) => void; onDecide: (decision: "add" | "skip") => void; onEdit: () => void }) {
  if (card.type === "catalog") return <CatalogView card={card} selection={catalog} onChange={onCatalog} />;
  if (card.type === "profile") return <ProfileView card={card} onDecide={onDecide} />;
  const blocked = missingRequired(card.list, card.data).length > 0;
  const { title, lines } = itemLines(card);
  return (
    <SwipeCard onSwipeRight={blocked ? undefined : () => onDecide("add")} onSwipeLeft={() => onDecide("skip")} rightLabel="ADICIONAR" leftLabel="NÃO ADICIONAR" onOpen={onEdit} openLabel="Editar este item" accessibilityLabel={`${LIST_TITLE[card.list]}: ${title}`}>
      <Surface>
        <View style={styles.badges}>
          <Text variant="label" tone="textMuted">{LIST_TITLE[card.list]}</Text>
          {card.confidence !== "high" ? <Text variant="label" tone="warning">Confira</Text> : null}
        </View>
        <Text variant="heading">{title}</Text>
        {lines.map((line, i) => <Text key={i} tone="textMuted">{line}</Text>)}
        {card.warnings.includes("year_only") ? <Text variant="caption" tone="textMuted">Confira o mês: o currículo informa só o ano.</Text> : null}
        {blocked ? <Text variant="caption" tone="error" accessibilityRole="alert">Falta preencher alguns campos para poder adicionar.</Text> : null}
        {Object.values(errors ?? {}).flat().map((message) => <Text key={message} variant="caption" tone="error">{message}</Text>)}
        <Button label="Editar" variant="secondary" onPress={onEdit} />
      </Surface>
    </SwipeCard>
  );
}

function ProfileView({ card, onDecide }: { card: ProfileCard; onDecide: (decision: "add" | "skip") => void }) {
  const { field, value, current } = card.item;
  const conflict = isConflict(card);
  const body = (
    <Surface>
      <Text variant="label" tone="textMuted">{PROFILE_LABELS[field] ?? field}</Text>
      {conflict ? <Text tone="textMuted">Atual: {profileValue(field, current)}</Text> : null}
      <Text variant="heading">{conflict ? "Encontrado: " : ""}{profileValue(field, value)}</Text>
      {conflict ? <Text variant="caption" tone="textMuted">Este campo já está preenchido. Escolha qual manter.</Text> : null}
    </Surface>
  );
  // Conflito: só botões (escolha explícita, nunca por swipe).
  if (conflict) return body;
  return (
    <SwipeCard onSwipeRight={() => onDecide("add")} onSwipeLeft={() => onDecide("skip")} rightLabel="ADICIONAR" leftLabel="NÃO ADICIONAR" accessibilityLabel={`${PROFILE_LABELS[field]}: ${profileValue(field, value)}`}>
      {body}
    </SwipeCard>
  );
}

function CatalogView({ card, selection, onChange }: { card: CatalogCard; selection: ReturnType<typeof initialCatalogSelection>; onChange: (next: ReturnType<typeof initialCatalogSelection>) => void }) {
  const toggle = (kind: "skills" | "knowledges", id: number) => {
    const next = new Set(selection[kind]);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...selection, [kind]: next });
  };
  return (
    <Surface>
      <Text variant="heading">Habilidades e conhecimentos</Text>
      <Text tone="textMuted">Toque para marcar ou desmarcar.</Text>
      <View style={styles.chips}>
        {card.skills.map((entry) => <Chip key={`s${entry.skill_id}`} label={entry.title} selected={selection.skills.has(entry.skill_id as number)} onPress={() => toggle("skills", entry.skill_id as number)} />)}
        {card.knowledges.map((entry) => <Chip key={`k${entry.knowledge_id}`} label={entry.title} selected={selection.knowledges.has(entry.knowledge_id as number)} onPress={() => toggle("knowledges", entry.knowledge_id as number)} />)}
      </View>
      {card.unmatched.length ? <Text variant="caption" tone="textMuted">Não estão no nosso catálogo: {card.unmatched.join(", ")}.</Text> : null}
    </Surface>
  );
}

function ReviewActions({ card, decisions, canGoBack, onBack, onDecide, onEdit, onCatalogContinue }: { card: Card; decisions: Decisions; canGoBack: boolean; onBack: () => void; onDecide: (decision: "add" | "skip") => void; onEdit: () => void; onCatalogContinue: () => void }) {
  if (card.type === "catalog") {
    return (
      <>
        <Button label="Continuar" onPress={onCatalogContinue} fullWidth />
        {canGoBack ? <Button label="Voltar ao item anterior" variant="ghost" onPress={onBack} fullWidth /> : null}
      </>
    );
  }
  if (card.type === "profile" && isConflict(card)) {
    return (
      <>
        <Button label="Usar o do PDF" onPress={() => onDecide("add")} fullWidth />
        <Button label="Manter o atual" variant="secondary" onPress={() => onDecide("skip")} fullWidth />
        {canGoBack ? <Button label="Voltar ao item anterior" variant="ghost" onPress={onBack} fullWidth /> : null}
      </>
    );
  }
  const blocked = card.type === "item" && missingRequired(card.list, card.data).length > 0;
  return (
    <>
      <Button label={blocked ? "Preencher o que falta" : "Adicionar"} onPress={() => (blocked ? onEdit() : onDecide("add"))} fullWidth />
      <Button label="Não adicionar" variant="secondary" onPress={() => onDecide("skip")} fullWidth />
      {canGoBack ? <Button label="Voltar ao item anterior" variant="ghost" onPress={onBack} fullWidth /> : null}
      <Text variant="caption" tone="textMuted" center>Dica: arraste o card para a direita para adicionar ou para a esquerda para pular.</Text>
    </>
  );
}

function Summary({ built }: { built: ReturnType<typeof buildApplyPayload> }) {
  const p = built.payload;
  const rows: [string, number][] = [
    ["Campos do perfil", Object.keys(p.profile).length],
    ["Experiências", p.employment_histories.length],
    ["Formações", p.academic_histories.length],
    ["Links", p.professional_links.length + p.social_links.length],
    ["Habilidades e conhecimentos", p.skill_ids.length + p.knowledge_ids.length],
  ];
  return (
    <Surface>
      {rows.filter(([, count]) => count > 0).map(([label, count]) => (
        <View key={label} style={styles.row}>
          <Text tone="textMuted">{label}</Text>
          <Text variant="bodyStrong">{count}</Text>
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: "row", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: colors.border },
});
