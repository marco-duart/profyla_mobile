import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { ApiError } from "@/api/errors";

const DAY = 24 * 60 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: DAY,
        // Erros do servidor (4xx) não melhoram tentando de novo; falha de rede sim.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status && error.status < 500) && failureCount < 2,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  });
}

export const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "profyla.query-cache", throttleTime: 2000 });

// Só dados de leitura que ajudam a abrir o app já com conteúdo. Nada de conta, exportação nem notificações.
const PERSISTED = new Set(["curriculum", "jobs", "applications", "catalog", "home"]);

export const persistOptions = {
  persister,
  maxAge: DAY,
  buster: "1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === "success" && PERSISTED.has(String(query.queryKey[0])),
  },
};

/** Faz o React Query saber se há internet (pausa e retoma as buscas) e quando o app volta para a frente (refetch). */
export function wireOnlineManager(): () => void {
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))));
  const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
  return () => {
    onlineManager.setEventListener(() => () => undefined);
    subscription.remove();
  };
}
