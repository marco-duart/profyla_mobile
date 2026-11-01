import { matchPlace, normalizeSearch, placeLabel, searchPlaces, ufFromRegion } from "./places";

describe("busca de municípios", () => {
  it("ignora acento e caixa e prioriza o prefixo", () => {
    expect(searchPlaces("sao pau").slice(0, 3).map(placeLabel)).toContain("São Paulo - SP");
    expect(searchPlaces("CAMPINAS")[0]).toEqual({ name: "Campinas", uf: "SP" });
  });

  it("não busca com menos de 2 letras", () => {
    expect(searchPlaces("s")).toEqual([]);
  });

  it("encontra cidades com o mesmo nome em estados diferentes", () => {
    const ufs = searchPlaces("Bom Jesus", 20).filter((place) => place.name === "Bom Jesus").map((place) => place.uf);
    expect(ufs.length).toBeGreaterThan(1);
  });

  it("normaliza o texto da busca", () => {
    expect(normalizeSearch("  Maceió ")).toBe("maceio");
  });
});

describe("ligação do GPS com a lista de municípios", () => {
  it("reconhece o estado por nome ou sigla", () => {
    expect(ufFromRegion("São Paulo")).toBe("SP");
    expect(ufFromRegion("sp")).toBe("SP");
    expect(ufFromRegion("State of Minas Gerais")).toBe("MG");
    expect(ufFromRegion("Texas")).toBeNull();
    expect(ufFromRegion(null)).toBeNull();
  });

  it("acha o município certo com o estado", () => {
    expect(matchPlace("Campinas", "São Paulo")).toEqual({ name: "Campinas", uf: "SP" });
    expect(matchPlace("campinas", "SP")).toEqual({ name: "Campinas", uf: "SP" });
    expect(matchPlace("Bom Jesus", "Piauí")).toEqual({ name: "Bom Jesus", uf: "PI" });
  });

  it("não chuta quando o nome existe em vários estados e o estado é desconhecido", () => {
    expect(matchPlace("Bom Jesus", null)).toBeNull();
  });

  it("devolve nada para cidade fora da lista ou vazia", () => {
    expect(matchPlace("Lisboa", "Lisboa")).toBeNull();
    expect(matchPlace(null, "SP")).toBeNull();
  });
});
