import { validateField } from "@/features/microflow/flow";
import { examQuestionsToSpecs, formFieldsToSpecs, toExamResponses, toFormResponses } from "./useQuestionFlow";

describe("formulário dinâmico", () => {
  const specs = formFieldsToSpecs([
    { id: 1, question: "Você tem CNH?", response_type: "boolean" },
    { id: 2, question: "Pretensão salarial", response_type: "number" },
    { id: 3, question: "Conte sobre você", response_type: "text" },
    { id: 4, question: "Quando pode começar?", response_type: "date" },
    { id: 5, question: "Cidade", response_type: "string" },
  ]);

  it("escolhe o controle certo para cada tipo de resposta", () => {
    expect(specs.map((spec) => spec.kind)).toEqual(["choice", "text", "multiline", "date", "text"]);
    expect(specs[0].options).toEqual([{ label: "Sim", value: true }, { label: "Não", value: false }]);
    expect(specs[1].keyboardType).toBe("numeric");
  });

  it("valida número", () => {
    expect(validateField(specs[1], { "2": "abc" })).toBe("Informe um número.");
    expect(validateField(specs[1], { "2": "4500,50" })).toBeNull();
  });

  it("monta as respostas no formato do backend, mantendo booleanos e ignorando vazios", () => {
    expect(toFormResponses({ "1": false, "2": "4500", "3": "", "5": "Campinas" })).toEqual({
      1: { response: false }, 2: { response: "4500" }, 5: { response: "Campinas" },
    });
  });
});

describe("prova", () => {
  it("cada pergunta vira uma escolha com as alternativas", () => {
    const specs = examQuestionsToSpecs([{ id: 10, text: "2 + 2?", alternatives: [{ id: 100, text: "3" }, { id: 101, text: "4" }] }]);
    expect(specs[0].kind).toBe("choice");
    expect(specs[0].options).toEqual([{ label: "3", value: "100" }, { label: "4", value: "101" }]);
  });

  it("só as respostas intermediárias avançam sozinhas; a última exige o botão de envio", () => {
    const specs = examQuestionsToSpecs([
      { id: 1, text: "a", alternatives: [{ id: 1, text: "x" }] },
      { id: 2, text: "b", alternatives: [{ id: 2, text: "y" }] },
    ]);
    expect(specs.map((spec) => spec.autoAdvance)).toEqual([true, false]);
  });

  it("envia pares pergunta/alternativa como números", () => {
    expect(toExamResponses({ "10": "101", "11": "7" })).toEqual([{ question_id: 10, alternative_id: 101 }, { question_id: 11, alternative_id: 7 }]);
  });
});
