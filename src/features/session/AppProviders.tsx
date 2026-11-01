import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useMemo, type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/ui/toast/ToastProvider";
import { StyleSheet } from "react-native";
import { createQueryClient, persistOptions, wireOnlineManager } from "./queryClient";
import { SessionProvider } from "./SessionProvider";

/** Raiz de provedores: gestos, áreas seguras, cache de dados (persistido), sessão e avisos. */
export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => createQueryClient(), []);
  useEffect(() => wireOnlineManager(), []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
