import raw from "./municipios.json";

// Municípios brasileiros (fonte: IBGE, API de localidades, dados públicos), embutidos para funcionar sem rede.
export type Place = { name: string; uf: string };

const ALL: Place[] = (raw as [string, string][]).map(([name, uf]) => ({ name, uf }));

export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

const INDEX = ALL.map((place) => ({ place, key: normalizeSearch(place.name) }));

/** Busca por prefixo primeiro (nomes mais curtos antes: "São Paulo" vence "São Paulo de Olivença") e depois por trecho, sem diferenciar acento nem caixa. */
export function searchPlaces(query: string, limit = 8): Place[] {
  const key = normalizeSearch(query);
  if (key.length < 2) return [];
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const item of INDEX) {
    if (item.key.startsWith(key)) starts.push(item.place);
    else if (contains.length < limit && item.key.includes(key)) contains.push(item.place);
  }
  starts.sort((a, b) => a.name.length - b.name.length);
  return [...starts, ...contains].slice(0, limit);
}

export const placeLabel = (place: Place) => `${place.name} - ${place.uf}`;

const UF_NAMES: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE", "distrito federal": "DF", "espirito santo": "ES", goias: "GO",
  maranhao: "MA", "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR", pernambuco: "PE",
  piaui: "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR", "santa catarina": "SC",
  "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

/** Sigla do estado a partir do que o geocodificador devolve ("São Paulo", "SP", "State of São Paulo"). */
export function ufFromRegion(region?: string | null): string | null {
  if (!region) return null;
  const key = normalizeSearch(region).replace(/^(state of|estado de|estado do|estado da)\s+/, "");
  if (/^[a-z]{2}$/.test(key) && Object.values(UF_NAMES).includes(key.toUpperCase())) return key.toUpperCase();
  return UF_NAMES[key] ?? null;
}

/**
 * Liga o nome de cidade devolvido pelo GPS a um município da lista. Nome igual e estado igual vence;
 * sem estado reconhecido, só vale se o nome existir em um único estado (evita chutar entre "Bom Jesus" de vários).
 */
export function matchPlace(city?: string | null, region?: string | null): Place | null {
  if (!city) return null;
  const key = normalizeSearch(city);
  const candidates = INDEX.filter((item) => item.key === key).map((item) => item.place);
  if (candidates.length === 0) return null;
  const uf = ufFromRegion(region);
  if (uf) return candidates.find((place) => place.uf === uf) ?? null;
  return candidates.length === 1 ? candidates[0] : null;
}
