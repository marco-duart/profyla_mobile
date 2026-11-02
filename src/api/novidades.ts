import { api } from "./client";

// Novidades da Maaxis (Painel de Controle): o app só fala com o backend do Profyla, nunca com o painel.
export const listNovidades = (placement: string) => api.get<unknown>("/api/novidades", { placement });

export const sendNovidadeEvents = (events: { announcementId: string; placement: string; type: "IMPRESSION" | "CLICK" }[]) =>
  api.post<unknown>("/api/novidades/events", { events });
