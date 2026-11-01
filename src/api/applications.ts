import { api } from "./client";
import type { ApplicationDetail, CreateApplication, InterviewResponse, ListApplications, SubmitExamResponse, SubmitFormResponse, WithdrawApplication } from "./dto";

export const listApplications = () => api.get<ListApplications.Response>("/api/candidates/applications");

export const getApplication = (id: number) => api.get<ApplicationDetail.Response>(`/api/candidates/application/${id}`);

/** Candidatura: o backend pede o id da PRIMEIRA ETAPA do processo (initial_stage_id da vaga). */
export const createApplication = (params: CreateApplication.Params) => api.post<CreateApplication.Response>("/api/candidates/application", params);

export const withdrawApplication = (id: number, params: WithdrawApplication.Params) =>
  api.post<WithdrawApplication.Response>(`/api/candidates/application/${id}/withdraw`, params);

export const respondInterview = (applicationId: number, params: InterviewResponse.Params) =>
  api.post<InterviewResponse.Response>(`/api/candidates/application/${applicationId}/interview-response`, params);

export const submitFormResponse = (params: SubmitFormResponse.Params) => api.post<SubmitFormResponse.Response>("/api/candidates/application-form/response", params);

export const submitExamResponse = (params: SubmitExamResponse.Params) => api.post<SubmitExamResponse.Response>("/api/candidates/application-exam/response", params);

/** Arquivo .ics da entrevista (texto). */
export const getInterviewCalendar = (applicationId: number, interviewId: number) =>
  api.get<string>(`/api/candidates/application/${applicationId}/interview/${interviewId}/calendar`, undefined, {
    responseType: "text",
    transformResponse: (data: string) => data,
  });
