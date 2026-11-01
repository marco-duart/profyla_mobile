import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

/**
 * Há internet agora? Lê o mesmo estado que o React Query usa (alimentado pelo NetInfo em `wireOnlineManager`),
 * para o aviso "Você está sem conexão" e para desabilitar ações que precisam do servidor.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline(), () => true);
}
