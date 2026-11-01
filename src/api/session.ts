import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AuthHeaders = {
  accessToken: string;
  client: string;
  uid: string;
  tokenType: string;
  expiry?: string;
};

const KEY = "profyla.auth.headers";

// Token só no armazenamento seguro (keychain/keystore). Na web (só desenvolvimento) cai para o localStorage.
const storage = {
  get: async (): Promise<string | null> => {
    if (Platform.OS === "web") return typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    return SecureStore.getItemAsync(KEY);
  },
  set: async (value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  },
  remove: async (): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};

function isHeaders(value: unknown): value is AuthHeaders {
  const v = value as Partial<AuthHeaders> | null;
  return Boolean(v && typeof v.accessToken === "string" && typeof v.client === "string" && typeof v.uid === "string");
}

type Listener = (headers: AuthHeaders | null) => void;

/** Sessão em memória + persistência. As requisições leem daqui de forma síncrona. */
class SessionStore {
  private current: AuthHeaders | null = null;
  private listeners = new Set<Listener>();

  async load(): Promise<AuthHeaders | null> {
    try {
      const raw = await storage.get();
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      this.current = isHeaders(parsed) ? parsed : null;
    } catch {
      this.current = null;
    }
    return this.current;
  }

  get(): AuthHeaders | null {
    return this.current;
  }

  /** Grava os headers novos (login ou rotação de token) na memória na hora e no armazenamento em seguida. */
  async set(headers: AuthHeaders): Promise<void> {
    this.current = headers;
    await storage.set(JSON.stringify(headers)).catch(() => undefined);
    this.listeners.forEach((listener) => listener(headers));
  }

  async clear(): Promise<void> {
    this.current = null;
    await storage.remove().catch(() => undefined);
    this.listeners.forEach((listener) => listener(null));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const session = new SessionStore();
