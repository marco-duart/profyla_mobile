import { clampIndex, pruneHidden, validateField, visibleFields, CHOICE_MESSAGE, REQUIRED_MESSAGE } from "./flow";
import type { FieldSpec } from "./types";

const fields: FieldSpec[] = [
  { key: "role", kind: "text", title: "Cargo" },
  { key: "current", kind: "choice", title: "Atual?", options: [{ label: "Sim", value: true }, { label: "Não", value: false }] },
  { key: "end", kind: "monthYear", title: "Término", when: (values) => values.current === false },
  { key: "note", kind: "text", title: "Obs.", optional: true, maxLength: 5, validate: (value) => (value === "xx" ? "Não pode xx." : null) },
];

describe("visibleFields", () => {
  it("esconde o término enquanto não se sabe que o emprego acabou", () => {
    expect(visibleFields(fields, {}).map((f) => f.key)).toEqual(["role", "current", "note"]);
    expect(visibleFields(fields, { current: false }).map((f) => f.key)).toEqual(["role", "current", "end", "note"]);
    expect(visibleFields(fields, { current: true }).map((f) => f.key)).toEqual(["role", "current", "note"]);
  });
});

describe("validateField", () => {
  it("exige o que não é opcional, com mensagem própria para escolha", () => {
    expect(validateField(fields[0], { role: "  " })).toBe(REQUIRED_MESSAGE);
    expect(validateField(fields[1], {})).toBe(CHOICE_MESSAGE);
  });

  it("false é uma resposta válida (não conta como vazio)", () => {
    expect(validateField(fields[1], { current: false })).toBeNull();
  });

  it("campo opcional vazio passa; preenchido passa pelas regras próprias", () => {
    expect(validateField(fields[3], {})).toBeNull();
    expect(validateField(fields[3], { note: "xx" })).toBe("Não pode xx.");
    expect(validateField(fields[3], { note: "abcdef" })).toBe("No máximo 5 caracteres.");
    expect(validateField(fields[3], { note: "ok" })).toBeNull();
  });
});

describe("pruneHidden", () => {
  it("descarta a resposta de um campo que deixou de aparecer", () => {
    expect(pruneHidden(fields, { role: "Dev", current: true, end: "2020-01" })).toEqual({ role: "Dev", current: true });
  });

  it("mantém chaves que não pertencem ao fluxo", () => {
    expect(pruneHidden(fields, { role: "Dev", extra: 1 })).toEqual({ role: "Dev", extra: 1 });
  });
});

describe("clampIndex", () => {
  it("mantém o índice dentro dos passos", () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(0, 0)).toBe(0);
  });
});
