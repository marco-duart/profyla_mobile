import type { CurriculumImport } from "@/api/dto";

// Lógica da revisão do currículo importado, sem tela: monta os cards, aplica as decisões e prepara o envio.
// É a mesma regra da revisão web (WP-42), pensada para cards.

export type ListKind = "employment" | "academic" | "professional" | "social";
export type Data = Record<string, string | null>;

export type ItemCard = {
  type: "item";
  list: ListKind;
  key: string;
  confidence: CurriculumImport.Confidence;
  warnings: string[];
  original: Data;
  data: Data;
};

export type ProfileCard = { type: "profile"; item: CurriculumImport.ProfileItem };

export type CatalogCard = { type: "catalog"; skills: CurriculumImport.CatalogEntry[]; knowledges: CurriculumImport.CatalogEntry[]; unmatched: string[] };

export type Card = ItemCard | ProfileCard | CatalogCard;

export const LIST_SECTION: Record<ListKind, "employment_histories" | "academic_histories" | "professional_links" | "social_links"> = {
  employment: "employment_histories",
  academic: "academic_histories",
  professional: "professional_links",
  social: "social_links",
};

export const REQUIRED: Record<ListKind, string[]> = {
  employment: ["company_name", "position", "start_date"],
  academic: ["title", "institution", "degree", "start_date"],
  professional: ["title", "link"],
  social: ["title", "link"],
};

const toData = (value: object): Data => Object.fromEntries(Object.entries(value).map(([name, item]) => [name, item == null ? null : String(item)]));

export function missingRequired(list: ListKind, data: Data): string[] {
  return REQUIRED[list].filter((field) => !(data[field] ?? "").trim());
}

export function cleanData(data: Data): Data {
  return Object.fromEntries(Object.entries(data).map(([name, value]) => [name, value && value.trim() ? value.trim() : null]));
}

export const isEdited = (card: ItemCard): boolean => JSON.stringify(cleanData(card.data)) !== JSON.stringify(cleanData(card.original));

/** Itens da lista, depois os campos do perfil, depois habilidades: a ordem em que a pilha é mostrada. */
export function buildCards(draft: CurriculumImport.Draft): Card[] {
  const cards: Card[] = [];
  const add = (list: ListKind, items: CurriculumImport.ListItem<object>[]) => {
    items.forEach((item) => {
      const data = toData(item.data);
      cards.push({ type: "item", list, key: item.key, confidence: item.confidence, warnings: item.warnings, original: { ...data }, data });
    });
  };
  add("employment", draft.employment_histories);
  add("academic", draft.academic_histories);
  add("professional", draft.professional_links);
  add("social", draft.social_links);
  draft.profile.forEach((item) => cards.push({ type: "profile", item }));
  if (draft.skills.length || draft.knowledges.length || draft.unmatched_terms.length) {
    cards.push({ type: "catalog", skills: draft.skills, knowledges: draft.knowledges, unmatched: draft.unmatched_terms });
  }
  return cards;
}

export const cardId = (card: Card): string => (card.type === "item" ? card.key : card.type === "profile" ? `profile-${card.item.field}` : "catalog");

export type Decision = "add" | "skip";
export type Decisions = Record<string, Decision>;

/** O perfil já preenchido com outro valor exige escolha explícita (nunca por swipe). */
export const isConflict = (card: Card): card is ProfileCard => card.type === "profile" && card.item.current !== null && card.item.current !== "";

/** Pré-seleção que o servidor sugeriu: a decisão inicial de cada card. */
export function initialDecisions(cards: Card[]): Decisions {
  const decisions: Decisions = {};
  cards.forEach((card) => {
    if (card.type === "item") decisions[cardId(card)] = card.confidence === "low" || missingRequired(card.list, card.data).length ? "skip" : "add";
    else if (card.type === "profile") decisions[cardId(card)] = card.item.selected ? "add" : "skip";
  });
  return decisions;
}

export type CatalogSelection = { skills: Set<number>; knowledges: Set<number> };

export function initialCatalogSelection(cards: Card[]): CatalogSelection {
  const card = cards.find((item): item is CatalogCard => item.type === "catalog");
  return {
    skills: new Set((card?.skills ?? []).filter((entry) => entry.selected).map((entry) => entry.skill_id as number)),
    knowledges: new Set((card?.knowledges ?? []).filter((entry) => entry.selected).map((entry) => entry.knowledge_id as number)),
  };
}

export type BuiltPayload = { payload: CurriculumImport.ApplyPayload; order: Record<string, string[]>; count: number };

export function buildApplyPayload(runId: number, cards: Card[], decisions: Decisions, catalog: CatalogSelection): BuiltPayload {
  const order: Record<string, string[]> = {};
  const lists: Record<ListKind, { data: Data; edited: boolean }[]> = { employment: [], academic: [], professional: [], social: [] };
  const profile: CurriculumImport.ApplyPayload["profile"] = {};

  cards.forEach((card) => {
    if (decisions[cardId(card)] !== "add") return;
    if (card.type === "item") {
      if (missingRequired(card.list, card.data).length) return;
      const section = LIST_SECTION[card.list];
      (order[section] ??= []).push(card.key);
      lists[card.list].push({ data: cleanData(card.data), edited: isEdited(card) });
    } else if (card.type === "profile") {
      profile[card.item.field] = card.item.value;
    }
  });

  const payload = {
    run_id: runId,
    profile,
    employment_histories: lists.employment,
    academic_histories: lists.academic,
    professional_links: lists.professional,
    social_links: lists.social,
    skill_ids: [...catalog.skills],
    knowledge_ids: [...catalog.knowledges],
  } as unknown as CurriculumImport.ApplyPayload;

  const count =
    Object.keys(profile).length + Object.values(lists).reduce((sum, items) => sum + items.length, 0) + catalog.skills.size + catalog.knowledges.size;
  return { payload, order, count };
}

export type MappedErrors = { byCard: Record<string, Record<string, string[]>>; profile: string[] };

/** "employment_histories.1.start_date" -> o card que estava na posição 1 do que foi enviado. */
export function mapDetailsToCards(details: Record<string, string[]>, order: Record<string, string[]>, profileLabels: Record<string, string>): MappedErrors {
  const byCard: MappedErrors["byCard"] = {};
  const profile: string[] = [];
  Object.entries(details).forEach(([path, messages]) => {
    const [section, index, field] = path.split(".");
    if (section === "profile") {
      profile.push(`${profileLabels[index] ?? index}: ${messages.join(", ")}`);
      return;
    }
    const key = order[section]?.[Number(index)];
    if (key && field) byCard[key] = { ...byCard[key], [field]: messages };
  });
  return { byCard, profile };
}
