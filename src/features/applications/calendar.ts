import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { getInterviewCalendar } from "@/api/applications";
import { shareTextFile } from "@/lib/shareFile";

export type CalendarEventInput = { title: string; startDate: Date; endDate: Date; location?: string; notes?: string };

export type AddResult = "added" | "shared" | "unavailable";

/** Entrevista dura 1 hora por padrão (o backend só guarda o início). */
export const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export function interviewToEvent(interview: { date_time: string; interview_type: string; interview_method: string; interviewer: string }, jobName: string, companyName: string): CalendarEventInput {
  const startDate = new Date(interview.date_time);
  return {
    title: `Entrevista: ${jobName} (${companyName})`,
    startDate,
    endDate: new Date(startDate.getTime() + DEFAULT_DURATION_MS),
    location: interview.interview_method,
    notes: `Tipo: ${interview.interview_type}\nEntrevistador(a): ${interview.interviewer}`,
  };
}

/**
 * Adiciona a entrevista ao calendário do aparelho (permissão pedida só agora, de escrita). Se a pessoa negar ou
 * o aparelho não permitir, cai para o arquivo .ics do servidor, que abre no app de calendário pela folha de
 * compartilhamento. O app nunca fica sem caminho (plano, 7.5).
 */
export async function addInterviewToCalendar(event: CalendarEventInput, applicationId: number, interviewId: number): Promise<AddResult> {
  if (Platform.OS !== "web") {
    try {
      const permission = await Calendar.requestCalendarPermissions(true);
      if (permission.granted) {
        const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
        const target = calendars.find((calendar) => calendar.allowsModifications && calendar.isPrimary) ?? calendars.find((calendar) => calendar.allowsModifications);
        if (target) {
          await target.createEvent({ title: event.title, startDate: event.startDate, endDate: event.endDate, location: event.location, notes: event.notes });
          return "added";
        }
      }
    } catch {
      // segue para o .ics
    }
  }
  try {
    const ics = await getInterviewCalendar(applicationId, interviewId);
    return (await shareTextFile("entrevista.ics", ics, "text/calendar", "Adicionar ao calendário")) ? "shared" : "unavailable";
  } catch {
    return "unavailable";
  }
}
