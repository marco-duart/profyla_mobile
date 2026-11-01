import { api } from "./client";
import type { OpportunityDetail, OpportunityList } from "./dto";

export function listOpportunities(search?: string): Promise<OpportunityList.Response> {
  // O backend busca pelo primeiro valor de q[...]: título da vaga contém o termo.
  return api.get<OpportunityList.Response>("/api/candidates/opportunities", search ? { "q[job_posting_title_cont]": search } : undefined);
}

export const getOpportunity = (id: number) => api.get<OpportunityDetail.Response>(`/api/candidates/opportunity/${id}`);
