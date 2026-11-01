import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getApplication, listApplications } from "@/api/applications";
import { useSession } from "@/features/session/SessionProvider";
import { derivePending } from "./pending";

/** Pendências derivadas do detalhe de cada candidatura em andamento (uma busca por candidatura). */
export function usePendingTasks() {
  const { status } = useSession();
  // Sem sessão não há o que buscar (e a chamada voltaria 401).
  const list = useQuery({ queryKey: ["applications"], queryFn: listApplications, enabled: status === "signedIn" });
  const active = useMemo(() => (list.data ?? []).filter((item) => !item.terminal_state), [list.data]);
  const details = useQueries({ queries: active.map((item) => ({ queryKey: ["application", item.id], queryFn: () => getApplication(item.id) })) });

  const loaded = details.map((query) => query.data).filter((data): data is NonNullable<typeof data> => Boolean(data));
  const tasks = useMemo(() => derivePending(loaded), [loaded]);
  const loading = list.isPending || details.some((query) => query.isPending);
  return { tasks, loading, list, refetch: () => Promise.all([list.refetch(), ...details.map((query) => query.refetch())]) };
}
