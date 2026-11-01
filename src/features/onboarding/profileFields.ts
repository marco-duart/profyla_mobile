import { subYears } from "date-fns";
import type { CreateCandidateProfile, CreateAcademic, CreateEmployment } from "@/api/dto";
import { DEGREE_OPTIONS, DEGREES_WITHOUT_COURSE, GENDER_OPTIONS, HOUSING_OPTIONS, POSITION_SUGGESTIONS } from "@/data/suggestions";
import { type Place, placeLabel } from "@/data/places";
import type { FieldSpec, Values } from "@/features/microflow/types";
import { locateCity } from "@/lib/location";
import { onlyDigits, isValidPhone, maskPhone } from "@/lib/masks";

export const RESUME_MAX = 2000;
export const MIN_AGE = 14;
export const MAX_AGE = 90;

function ageOf(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age;
}

export function birthdateProblem(iso: string, today = new Date()): string | null {
  const age = ageOf(iso, today);
  if (age < MIN_AGE) return `É preciso ter ao menos ${MIN_AGE} anos.`;
  if (age > MAX_AGE) return "Confira a data: ela indica mais de 90 anos.";
  return null;
}

const firstName = (place?: unknown) => (place as Place | undefined)?.name;

/** Sugestões de abertura do resumo, montadas só com o que a pessoa respondeu (regra local, sem IA). */
export function resumeStarters(values: Values): string[] {
  const city = firstName(values.city);
  const where = city ? ` em ${city}` : "";
  return [
    values.employed === true ? `Estou empregado(a) e busco novas oportunidades${where}.` : `Busco minha próxima oportunidade profissional${where}.`,
    `Busco minha primeira oportunidade${where} e tenho vontade de aprender.`,
    `Tenho disponibilidade para começar logo${where}.`,
  ];
}

/** Etapa mínima do perfil: exatamente o que POST /api/candidates exige hoje, em nove micro-passos. */
export const PROFILE_FIELDS: FieldSpec[] = [
  { key: "phone", kind: "text", title: "Qual é o seu celular?", help: "Usamos para avisar sobre novidades nas suas candidaturas.", label: "Celular com DDD", keyboardType: "phone-pad", mask: maskPhone, validate: (value) => (isValidPhone(String(value)) ? null : "Informe o DDD e o número.") },
  { key: "city", kind: "place", title: "Em que cidade você mora?", help: "Comece a digitar e toque na sugestão, ou use a sua localização.", label: "Cidade", shortcut: { label: "Usar minha localização", apply: () => locateCity() } },
  { key: "neighborhood", kind: "text", title: "Qual é o seu bairro?", label: "Bairro", autoCapitalize: "words" },
  { key: "birthplace", kind: "place", title: "Onde você nasceu?", label: "Cidade de nascimento", shortcut: { label: "Mesma cidade onde moro", apply: (values) => values.city } },
  {
    key: "birthdate",
    kind: "date",
    title: "Qual é a sua data de nascimento?",
    label: "Data de nascimento",
    maximumDate: () => subYears(new Date(), MIN_AGE),
    minimumDate: () => subYears(new Date(), MAX_AGE),
    validate: (value) => birthdateProblem(String(value)),
  },
  { key: "gender", kind: "choice", title: "Como você se identifica?", options: GENDER_OPTIONS.map((label) => ({ label, value: label })) },
  { key: "housing", kind: "choice", title: "Como é a sua moradia?", options: HOUSING_OPTIONS },
  { key: "employed", kind: "choice", title: "Você está empregado(a) hoje?", options: [{ label: "Sim", value: true }, { label: "Não", value: false }] },
  { key: "resume", kind: "multiline", title: "Conte um pouco sobre você", help: "Duas ou três frases já ajudam bastante. Toque numa sugestão para começar.", label: "Resumo profissional", maxLength: RESUME_MAX, starters: resumeStarters },
];

export function toProfileParams(values: Values): CreateCandidateProfile.Params {
  const city = values.city as Place;
  const birthplace = values.birthplace as Place;
  return {
    phone_number1: onlyDigits(String(values.phone)),
    phone_number2: "",
    employee: values.employed === true,
    resume: String(values.resume).trim(),
    birthplace: placeLabel(birthplace),
    gender: String(values.gender),
    birthdate: String(values.birthdate),
    address_neighborhood: String(values.neighborhood).trim(),
    address_city: city.name,
    residence_status: String(values.housing),
  };
}

const monthStart = (month: unknown) => `${String(month)}-01`;

/** "Pular" no término vale como "ainda estou aqui". */
export const EXPERIENCE_FIELDS: FieldSpec[] = [
  { key: "position", kind: "text", title: "Qual era o seu cargo?", label: "Cargo", suggestions: POSITION_SUGGESTIONS, autoCapitalize: "sentences" },
  { key: "company", kind: "text", title: "Em que empresa?", label: "Empresa", autoCapitalize: "words" },
  { key: "start", kind: "monthYear", title: "Quando você começou?", label: "Início" },
  { key: "current", kind: "choice", title: "É o seu emprego atual?", options: [{ label: "Sim, ainda trabalho lá", value: true }, { label: "Não, já saí", value: false }] },
  {
    key: "end",
    kind: "monthYear",
    title: "Quando você saiu?",
    label: "Término",
    when: (values) => values.current === false,
    validate: (value, values) => (String(value) < String(values.start) ? "O término não pode ser antes do início." : null),
  },
];

export function toEmploymentParams(values: Values): CreateEmployment.Params {
  return {
    company_name: String(values.company).trim(),
    position: String(values.position).trim(),
    start_date: monthStart(values.start),
    ...(values.current === false && values.end ? { end_date: monthStart(values.end) } : {}),
  };
}

export const EDUCATION_FIELDS: FieldSpec[] = [
  { key: "degree", kind: "choice", title: "Qual é o nível?", options: DEGREE_OPTIONS.map((label) => ({ label, value: label })) },
  { key: "course", kind: "text", title: "Qual é o curso?", label: "Curso", autoCapitalize: "words", when: (values) => !DEGREES_WITHOUT_COURSE.includes(String(values.degree)) },
  { key: "institution", kind: "text", title: "Em que instituição?", label: "Instituição", autoCapitalize: "words" },
  { key: "start", kind: "monthYear", title: "Quando você começou?", label: "Início" },
  {
    key: "end",
    kind: "monthYear",
    title: "Quando terminou?",
    help: "Se ainda está cursando, toque em Pular.",
    label: "Conclusão",
    optional: true,
    skipLabel: "Ainda estou cursando",
    validate: (value, values) => (String(value) < String(values.start) ? "A conclusão não pode ser antes do início." : null),
  },
];

export function toAcademicParams(values: Values): CreateAcademic.Params {
  const degree = String(values.degree);
  return {
    title: DEGREES_WITHOUT_COURSE.includes(degree) ? degree : String(values.course).trim(),
    institution: String(values.institution).trim(),
    degree,
    start_date: monthStart(values.start),
    ...(values.end ? { end_date: monthStart(values.end) } : {}),
  };
}

