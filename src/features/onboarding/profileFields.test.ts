import type { Place } from "@/data/places";
import { validateField, visibleFields } from "@/features/microflow/flow";
import { EDUCATION_FIELDS, EXPERIENCE_FIELDS, PROFILE_FIELDS, birthdateProblem, resumeStarters, toAcademicParams, toEmploymentParams, toProfileParams } from "./profileFields";

const campinas: Place = { name: "Campinas", uf: "SP" };

const answers = {
  phone: "(19) 98877-6655",
  city: campinas,
  neighborhood: " Centro ",
  birthplace: { name: "Santos", uf: "SP" },
  birthdate: "1994-07-21",
  gender: "Feminino",
  housing: "Alugada",
  employed: false,
  resume: " Busco minha próxima oportunidade. ",
};

describe("etapa mínima do perfil", () => {
  it("são nove micro-passos, na ordem do plano", () => {
    expect(PROFILE_FIELDS.map((field) => field.key)).toEqual(["phone", "city", "neighborhood", "birthplace", "birthdate", "gender", "housing", "employed", "resume"]);
  });

  it("monta exatamente o que POST /api/candidates exige, sem campos sensíveis", () => {
    const params = toProfileParams(answers);

    expect(params).toEqual({
      phone_number1: "19988776655",
      phone_number2: "",
      employee: false,
      resume: "Busco minha próxima oportunidade.",
      birthplace: "Santos - SP",
      gender: "Feminino",
      birthdate: "1994-07-21",
      address_neighborhood: "Centro",
      address_city: "Campinas",
      residence_status: "Alugada",
    });
    expect(Object.keys(params)).not.toEqual(expect.arrayContaining(["marital_status", "pcd", "smoker", "mother_name"]));
  });

  it("valida o telefone e o nascimento", () => {
    const phone = PROFILE_FIELDS[0];
    expect(validateField(phone, { phone: "(19) 9887" })).toBe("Informe o DDD e o número.");
    expect(validateField(phone, { phone: "(19) 98877-6655" })).toBeNull();
    const birth = PROFILE_FIELDS[4];
    expect(validateField(birth, { birthdate: "2020-01-01" })).toMatch(/ao menos 14 anos/);
    expect(validateField(birth, { birthdate: "1900-01-01" })).toMatch(/mais de 90 anos/);
  });

  it("a idade é calculada pelo aniversário, não só pelo ano", () => {
    const today = new Date(2026, 5, 10);
    expect(birthdateProblem("2012-06-11", today)).toMatch(/ao menos 14/);
    expect(birthdateProblem("2012-06-10", today)).toBeNull();
  });

  it("o atalho 'mesma cidade onde moro' copia a cidade", () => {
    const birthplace = PROFILE_FIELDS.find((field) => field.key === "birthplace");
    expect(birthplace?.shortcut?.apply({ city: campinas })).toEqual(campinas);
  });

  it("as sugestões de resumo usam a cidade e se está empregado", () => {
    expect(resumeStarters({ city: campinas, employed: true })[0]).toBe("Estou empregado(a) e busco novas oportunidades em Campinas.");
    expect(resumeStarters({ employed: false })[0]).toBe("Busco minha próxima oportunidade profissional.");
  });
});

describe("experiência", () => {
  it("o término só aparece quando a pessoa já saiu do emprego", () => {
    expect(visibleFields(EXPERIENCE_FIELDS, { current: true }).map((f) => f.key)).not.toContain("end");
    expect(visibleFields(EXPERIENCE_FIELDS, { current: false }).map((f) => f.key)).toContain("end");
  });

  it("monta o payload com dia 01 e sem término no emprego atual", () => {
    expect(toEmploymentParams({ position: " Vendedor(a) ", company: "Casas Modelo", start: "2019-03", current: true, end: "2020-01" })).toEqual({
      company_name: "Casas Modelo", position: "Vendedor(a)", start_date: "2019-03-01",
    });
    expect(toEmploymentParams({ position: "Dev", company: "Acme", start: "2019-03", current: false, end: "2021-08" })).toMatchObject({ end_date: "2021-08-01" });
  });

  it("recusa término antes do início", () => {
    const end = EXPERIENCE_FIELDS.find((field) => field.key === "end")!;
    expect(validateField(end, { start: "2020-05", end: "2019-01", current: false })).toBe("O término não pode ser antes do início.");
  });
});

describe("formação", () => {
  it("ensino médio não pergunta o curso e usa o nível como título", () => {
    expect(visibleFields(EDUCATION_FIELDS, { degree: "Ensino médio" }).map((f) => f.key)).not.toContain("course");
    expect(toAcademicParams({ degree: "Ensino médio", institution: "Colégio X", start: "2008-02", end: "2010-12" })).toEqual({
      title: "Ensino médio", institution: "Colégio X", degree: "Ensino médio", start_date: "2008-02-01", end_date: "2010-12-01",
    });
  });

  it("graduação pergunta o curso; conclusão é opcional (ainda cursando)", () => {
    expect(visibleFields(EDUCATION_FIELDS, { degree: "Graduação" }).map((f) => f.key)).toContain("course");
    const params = toAcademicParams({ degree: "Graduação", course: "Direito", institution: "UFC", start: "2015-02" });
    expect(params).toEqual({ title: "Direito", institution: "UFC", degree: "Graduação", start_date: "2015-02-01" });
  });
});
