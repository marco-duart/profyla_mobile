import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Um só lugar para datas em pt-BR. parseISO lê "1992-03-04" como data local, sem deslocar um dia.
function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value?: string | null, fallback = "-"): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : fallback;
}

export function formatMonthYear(value?: string | null, fallback = "-"): string {
  const date = toDate(value);
  return date ? format(date, "MMM/yyyy", { locale: ptBR }) : fallback;
}

export function formatDateTime(value?: string | null, fallback = "-"): string {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : fallback;
}

const WEEKDAYS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

/** "ter., 14/10/2026 às 14:30" (mesmo estilo dos e-mails). */
export function formatDateTimeLong(value?: string | null, fallback = "-"): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${WEEKDAYS[date.getDay()]}, ${format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** "2019-03-01" -> Date local (sem deslocar o dia). */
export function parseIsoDate(value?: string | null): Date | null {
  return toDate(value);
}
