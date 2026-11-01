import { parseMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  it("separa títulos, citações, listas e parágrafos", () => {
    const blocks = parseMarkdown(["# Termos", "", "> [REVISÃO JURÍDICA NECESSÁRIA]", "", "Texto em", "duas linhas.", "", "- um", "- dois", "", "## 1. Uso"].join("\n"));

    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Termos" },
      { type: "quote", text: "[REVISÃO JURÍDICA NECESSÁRIA]" },
      { type: "paragraph", text: "Texto em duas linhas." },
      { type: "list", items: ["um", "dois"] },
      { type: "heading", level: 2, text: "1. Uso" },
    ]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(parseMarkdown("")).toEqual([]);
  });
});
