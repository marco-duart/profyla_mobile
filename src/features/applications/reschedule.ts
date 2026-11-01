/** Horários oferecidos no reagendamento: escolher em vez de digitar (plano, princípio 2). */
export const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

/** Data (YYYY-MM-DD) + horário (HH:MM), no fuso do aparelho, como ISO 8601 para a API. */
export function toSuggestedDateTime(isoDate: string, time: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

/** A sugestão precisa ser no futuro. */
export function isFuture(isoDate: string, time: string, now = new Date()): boolean {
  return new Date(toSuggestedDateTime(isoDate, time)).getTime() > now.getTime();
}
