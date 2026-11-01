import { answerCurrent, goBack, isComplete, progressOf, restoreDraft, shuffledOrder, type Draft } from "./flow";

const ids = ["Q1", "Q2", "Q3"];
const empty = (): Draft => ({ order: ids, answers: {}, index: 0 });

describe("fluxo do teste", () => {
  it("responder grava a resposta da pergunta atual e avança", () => {
    const next = answerCurrent(empty(), "CP");
    expect(next).toEqual({ order: ids, answers: { Q1: "CP" }, index: 1 });
  });

  it("mesmas respostas dão o mesmo resultado por arrasto ou por botão (é a mesma função)", () => {
    const sequence = ["CT", "N", "DP"] as const;
    const bySwipe = sequence.reduce(answerCurrent, empty());
    const byButtons = sequence.reduce((draft, answer) => answerCurrent(draft, answer), empty());
    expect(bySwipe).toEqual(byButtons);
    expect(isComplete(bySwipe)).toBe(true);
  });

  it("voltar refaz a pergunta anterior e a nova resposta substitui a antiga", () => {
    let draft = answerCurrent(answerCurrent(empty(), "CT"), "DT");
    draft = goBack(draft);
    expect(draft.index).toBe(1);
    draft = answerCurrent(draft, "CP");
    expect(draft.answers).toEqual({ Q1: "CT", Q2: "CP" });
  });

  it("não volta antes da primeira pergunta nem responde depois da última", () => {
    expect(goBack(empty()).index).toBe(0);
    const done = ["CT", "CT", "CT"].reduce((draft, a) => answerCurrent(draft, a as "CT"), empty());
    expect(answerCurrent(done, "DT")).toEqual(done);
  });

  it("calcula o progresso sem passar do total", () => {
    expect(progressOf(empty())).toEqual({ current: 1, total: 3 });
    expect(progressOf({ ...empty(), index: 3 })).toEqual({ current: 3, total: 3 });
  });
});

describe("rascunho", () => {
  it("embaralha sem perder nem repetir perguntas", () => {
    const order = shuffledOrder(["a", "b", "c", "d", "e"], () => 0.3);
    expect([...order].sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("retoma o rascunho salvo quando as perguntas são as mesmas", () => {
    const saved: Draft = { order: ["Q3", "Q1", "Q2"], answers: { Q3: "CT" }, index: 1 };
    expect(restoreDraft(saved, ids)).toEqual(saved);
  });

  it("descarta o rascunho se as perguntas mudaram", () => {
    expect(restoreDraft({ order: ["Q1", "Q2"], answers: {}, index: 0 }, ids)).toBeNull();
    expect(restoreDraft({ order: ["Q1", "Q2", "QX"], answers: {}, index: 0 }, ids)).toBeNull();
    expect(restoreDraft(null, ids)).toBeNull();
  });

  it("ignora respostas de perguntas que não existem mais e limita o índice", () => {
    const restored = restoreDraft({ order: ids, answers: { Q1: "CT", QX: "DT" }, index: 99 }, ids);
    expect(restored?.answers).toEqual({ Q1: "CT" });
    expect(restored?.index).toBe(3);
  });
});
