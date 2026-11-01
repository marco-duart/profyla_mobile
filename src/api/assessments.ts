import { api } from "./client";
import type { DiscQuestions, DiscResult, EneagramaQuestions, EneagramaResult, SubmitDisc, SubmitEneagrama } from "./dto";

export const getDiscQuestions = () => api.get<DiscQuestions.Response>("/api/candidates/disc-assessment/questions");
export const submitDisc = (params: SubmitDisc.Params) => api.post<SubmitDisc.Response>("/api/candidates/disc-assessment", params);
export const getDiscResult = () => api.get<DiscResult.Response>("/api/candidates/disc-assessment");

export const getEneagramaQuestions = () => api.get<EneagramaQuestions.Response>("/api/candidates/eneagrama-assessment/questions");
export const submitEneagrama = (params: SubmitEneagrama.Params) => api.post<SubmitEneagrama.Response>("/api/candidates/eneagrama-assessment", params);
export const getEneagramaResult = () => api.get<EneagramaResult.Response>("/api/candidates/eneagrama-assessment");
