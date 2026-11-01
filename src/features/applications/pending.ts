import type { ApplicationDetail } from "@/api/dto";

export type PendingKind = "exam" | "form" | "interview";

export type PendingTask = {
  key: string;
  kind: PendingKind;
  applicationId: number;
  title: string;
  subtitle: string;
  interviewId?: number;
};

const LABEL: Record<PendingKind, string> = { exam: "Responder a prova", form: "Responder ao formulário", interview: "Responder ao convite de entrevista" };

/**
 * "O que falta": prova, formulário e entrevista sem resposta. Vem do detalhe de cada candidatura em andamento,
 * porque a lista de candidaturas não traz esse estado. Candidaturas encerradas nunca geram pendência.
 */
export function derivePending(details: ApplicationDetail.Response[]): PendingTask[] {
  const tasks: PendingTask[] = [];
  details.forEach((detail) => {
    if (detail.terminal_state) return;
    const where = `${detail.job_name} · ${detail.company_name}`;
    const { tools } = detail;
    if (tools.has_exam && !tools.exam_already_submitted) {
      tasks.push({ key: `exam-${detail.application_id}`, kind: "exam", applicationId: detail.application_id, title: LABEL.exam, subtitle: where });
    }
    if (tools.has_form && !tools.form_already_submitted) {
      tasks.push({ key: `form-${detail.application_id}`, kind: "form", applicationId: detail.application_id, title: LABEL.form, subtitle: where });
    }
    if (tools.can_respond_interview) {
      const interview = detail.interviews.find((item) => item.status === "pendente") ?? detail.interviews[0];
      tasks.push({ key: `interview-${detail.application_id}`, kind: "interview", applicationId: detail.application_id, title: LABEL.interview, subtitle: where, interviewId: interview?.id });
    }
  });
  return tasks;
}

/** A primeira aba ao abrir: com pendência, Candidaturas; sem, Vagas (plano, seção 6). */
export const initialTab = (pending: PendingTask[]): "applications" | "jobs" => (pending.length > 0 ? "applications" : "jobs");
