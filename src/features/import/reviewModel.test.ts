import type { CurriculumImport } from "@/api/dto";
import { buildApplyPayload, buildCards, cardId, initialCatalogSelection, initialDecisions, isConflict, isEdited, mapDetailsToCards, missingRequired, type ItemCard } from "./reviewModel";

const draft: CurriculumImport.Draft = {
  run_id: 7,
  source: { filename: "cv.pdf", pages_read: 1, truncated: false, columns_detected: false, headings_found: true, parser_version: "1", skipped_duplicates: 0, notes: [] },
  profile: [
    { field: "phone_number1", value: "19988776655", current: null, confidence: "high", selected: true },
    { field: "address_city", value: "Campinas", current: "Santos", confidence: "high", selected: false },
  ],
  employment_histories: [
    { key: "employment-0", confidence: "high", selected: true, missing: [], warnings: [], data: { company_name: "Acme", position: "Analista", start_date: "2019-03-01", end_date: null, achievements: null } },
    { key: "employment-1", confidence: "low", selected: false, missing: ["start_date"], warnings: [], data: { company_name: "Beta", position: "Dev", start_date: null, end_date: null, achievements: null } },
  ],
  academic_histories: [{ key: "academic-0", confidence: "medium", selected: true, missing: [], warnings: ["year_only"], data: { title: "Computação", institution: "UNICAMP", degree: "Bacharelado", start_date: "2012-01-01", end_date: null } }],
  professional_links: [{ key: "professional-0", confidence: "high", selected: true, missing: [], warnings: [], data: { title: "LinkedIn", link: "https://linkedin.com/in/x" } }],
  social_links: [],
  skills: [{ skill_id: 1, title: "Ruby", selected: true }, { skill_id: 2, title: "PHP", selected: false }],
  knowledges: [],
  unmatched_terms: ["Kubernetes"],
};

describe("buildCards", () => {
  const cards = buildCards(draft);

  it("mostra primeiro os itens das listas, depois o perfil e por fim as habilidades", () => {
    expect(cards.map(cardId)).toEqual(["employment-0", "employment-1", "academic-0", "professional-0", "profile-phone_number1", "profile-address_city", "catalog"]);
  });

  it("só o perfil com valor atual diferente é conflito (escolha explícita, nunca por swipe)", () => {
    expect(cards.filter(isConflict).map(cardId)).toEqual(["profile-address_city"]);
  });

  it("a decisão inicial respeita o que o servidor sugeriu e bloqueia o que está incompleto", () => {
    expect(initialDecisions(cards)).toEqual({
      "employment-0": "add", "employment-1": "skip", "academic-0": "add", "professional-0": "add", "profile-phone_number1": "add", "profile-address_city": "skip",
    });
  });

  it("a seleção inicial do catálogo vem do servidor", () => {
    const selection = initialCatalogSelection(cards);
    expect([...selection.skills]).toEqual([1]);
  });
});

describe("buildApplyPayload", () => {
  const cards = buildCards(draft);

  it("envia só o que foi adicionado, na ordem, e guarda a posição de cada card para mapear erros", () => {
    const decisions = { ...initialDecisions(cards), "employment-1": "add" as const };
    const built = buildApplyPayload(7, cards, decisions, initialCatalogSelection(cards));

    // employment-1 está incompleto: não vai, mesmo "adicionado".
    expect(built.payload.employment_histories.map((item) => item.data.company_name)).toEqual(["Acme"]);
    expect(built.order).toEqual({ employment_histories: ["employment-0"], academic_histories: ["academic-0"], professional_links: ["professional-0"] });
    expect(built.payload.profile).toEqual({ phone_number1: "19988776655" });
    expect(built.payload.skill_ids).toEqual([1]);
    expect(built.count).toBe(5);
  });

  it("marca como editado só o item que o candidato mudou", () => {
    const edited = buildCards(draft).map((card) => (card.type === "item" && card.key === "employment-0" ? { ...card, data: { ...card.data, position: "Analista Pleno" } } : card));
    const built = buildApplyPayload(7, edited, initialDecisions(edited), initialCatalogSelection(edited));

    expect(built.payload.employment_histories[0]).toMatchObject({ edited: true, data: { position: "Analista Pleno" } });
    expect(built.payload.academic_histories[0].edited).toBe(false);
  });

  it("substituir um campo do perfil só entra quando o candidato escolheu usar o do PDF", () => {
    const decisions = { ...initialDecisions(cards), "profile-address_city": "add" as const };
    expect(buildApplyPayload(7, cards, decisions, initialCatalogSelection(cards)).payload.profile).toEqual({ phone_number1: "19988776655", address_city: "Campinas" });
  });

  it("espaços e texto vazio viram null", () => {
    const card = buildCards(draft)[0] as ItemCard;
    expect(isEdited({ ...card, data: { ...card.data, achievements: "   " } })).toBe(false);
    expect(missingRequired("employment", { company_name: " ", position: "x", start_date: "2020-01-01" })).toEqual(["company_name"]);
  });
});

describe("mapDetailsToCards", () => {
  it("leva o erro do servidor para o card certo, mesmo com itens pulados antes dele", () => {
    const mapped = mapDetailsToCards(
      { "employment_histories.0.company_name": ["é obrigatório"], "profile.phone_number1": ["deve ter 10 ou 11 dígitos"] },
      { employment_histories: ["employment-3"] },
      { phone_number1: "Celular principal" },
    );

    expect(mapped.byCard).toEqual({ "employment-3": { company_name: ["é obrigatório"] } });
    expect(mapped.profile).toEqual(["Celular principal: deve ter 10 ou 11 dígitos"]);
  });
});
