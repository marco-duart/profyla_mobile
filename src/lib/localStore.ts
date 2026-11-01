import AsyncStorage from "@react-native-async-storage/async-storage";

// Preferências e rascunhos locais (nada sensível: tokens ficam no secure-store). Falha de leitura/escrita nunca
// quebra a tela: o app funciona sem esse armazenamento.
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignora
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignora
  }
}

export async function removeKeysWithPrefix(prefix: string): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // ignora
  }
}

/** Chaves locais do app (todas com o prefixo "profyla."). */
export const KEYS = {
  onboardingInProgress: "profyla.onboarding.inProgress",
  onboardingDraft: "profyla.onboarding.draft",
  dismissedJobs: "profyla.jobs.dismissed",
  gestureHintViews: "profyla.hint.views",
  formDraft: (kind: "form" | "exam", id: number) => `profyla.draft.${kind}.${id}`,
  assessmentDraft: (kind: "disc" | "eneagrama") => `profyla.draft.assessment.${kind}`,
} as const;

export const LOCAL_PREFIX = "profyla.";
