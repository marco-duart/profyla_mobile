import { linkToRoute } from "./linkToRoute";

describe("linkToRoute", () => {
  it("traduz o link de candidatura que o backend envia", () => {
    expect(linkToRoute("/candidate/applications/42")).toBe("/applications/42");
    expect(linkToRoute("/candidate/applications/42/")).toBe("/applications/42");
  });

  it("traduz listas e vagas", () => {
    expect(linkToRoute("/candidate/applications")).toBe("/(tabs)/applications");
    expect(linkToRoute("/candidate/opportunities/7")).toBe("/jobs/7");
    expect(linkToRoute("/candidate/assessments")).toBe("/(tabs)/assessments");
    expect(linkToRoute("/candidate/account")).toBe("/(tabs)/profile");
  });

  it("links do recrutador ou vazios não têm destino no app", () => {
    expect(linkToRoute("/staff/kanban")).toBeNull();
    expect(linkToRoute(null)).toBeNull();
    expect(linkToRoute("")).toBeNull();
  });
});
