import type { ApplicationDetail } from "@/api/dto";
import { derivePending, initialTab } from "./pending";

type Overrides = Partial<Omit<ApplicationDetail.Response, "tools">> & { tools?: Partial<ApplicationDetail.Response["tools"]> };

function detail(overrides: Overrides = {}): ApplicationDetail.Response {
  const { tools, ...rest } = overrides;
  return {
    application_id: 1, job_name: "Analista", company_name: "Acme", stage: "TRIAGEM", stage_id: 1, hiring_process_id: 1, terminal_state: false, status_tone: "neutral", summary: "",
    interviews: [], timeline: [], feedback: null,
    tools: { dynamic_form_id: null, dynamic_exam_id: null, has_form: false, has_exam: false, form_already_submitted: false, exam_already_submitted: false, can_withdraw: true, can_respond_interview: false, form_fields: [], exam_questions: [], ...tools },
    ...rest,
  };
}

describe("derivePending", () => {
  it("lista prova e formulário que ainda não foram respondidos", () => {
    const tasks = derivePending([detail({ tools: { has_exam: true, has_form: true } })]);
    expect(tasks.map((task) => task.kind)).toEqual(["exam", "form"]);
    expect(tasks[0].subtitle).toBe("Analista · Acme");
  });

  it("ignora o que já foi respondido", () => {
    expect(derivePending([detail({ tools: { has_exam: true, exam_already_submitted: true, has_form: true, form_already_submitted: true } })])).toEqual([]);
  });

  it("entrevista sem resposta aponta para o convite pendente", () => {
    const tasks = derivePending([
      detail({
        tools: { can_respond_interview: true },
        interviews: [
          { id: 5, date_time: "2026-11-10T14:00:00-03:00", interview_type: "RH", interviewer: "Bia", interview_method: "Meet", resume: "", status: "aceita" },
          { id: 6, date_time: "2026-11-12T14:00:00-03:00", interview_type: "Técnica", interviewer: "Caio", interview_method: "Meet", resume: "", status: "pendente" },
        ],
      }),
    ]);
    expect(tasks).toEqual([expect.objectContaining({ kind: "interview", applicationId: 1, interviewId: 6 })]);
  });

  it("candidatura encerrada nunca gera pendência", () => {
    expect(derivePending([detail({ terminal_state: true, tools: { has_exam: true, can_respond_interview: true } })])).toEqual([]);
  });

  it("a primeira aba depende de haver pendência", () => {
    expect(initialTab([])).toBe("jobs");
    expect(initialTab(derivePending([detail({ tools: { has_form: true } })]))).toBe("applications");
  });
});
