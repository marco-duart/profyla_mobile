// Sugestões de um toque para os passos de experiência e formação (escolher em vez de digitar).
export const POSITION_SUGGESTIONS = [
  "Auxiliar administrativo",
  "Assistente administrativo",
  "Atendente",
  "Vendedor(a)",
  "Operador(a) de caixa",
  "Estoquista",
  "Motorista",
  "Analista",
  "Desenvolvedor(a)",
  "Estagiário(a)",
];

export const DEGREE_OPTIONS = [
  "Ensino fundamental",
  "Ensino médio",
  "Técnico",
  "Tecnólogo",
  "Graduação",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
];

/** Níveis que não têm curso: o título repete o nível (como no importador do PDF). */
export const DEGREES_WITHOUT_COURSE = ["Ensino fundamental", "Ensino médio"];

export const GENDER_OPTIONS = ["Feminino", "Masculino", "Outro", "Prefiro não informar"];

// Os valores seguem o formulário do web (sem acento), os rótulos são para leitura.
export const HOUSING_OPTIONS = [
  { label: "Própria", value: "Propria" },
  { label: "Alugada", value: "Alugada" },
  { label: "Financiada", value: "Financiada" },
  { label: "Com familiares", value: "Com familiares" },
];
