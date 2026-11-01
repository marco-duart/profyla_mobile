import { api } from "./client";
import type { CatalogItem, CreateAcademic, CreateCandidateProfile, CreateEmployment, CreateLink, CurriculumData, CurriculumImport, HomeData } from "./dto";
import { buildFileForm, MULTIPART, type PickedFile } from "./files";

export const getHome = () => api.get<HomeData.Response>("/api/candidates/home");

export const getCurriculum = () => api.get<CurriculumData.Response>("/api/candidates/curriculum");

export const createCandidateProfile = (params: CreateCandidateProfile.Params) => api.post<CreateCandidateProfile.Response>("/api/candidates", params);

// Formação, experiência e links
export const createAcademic = (params: CreateAcademic.Params) => api.post<void>("/api/candidates/academic", params);
export const updateAcademic = (id: number, params: Partial<CreateAcademic.Params>) => api.patch<void>(`/api/candidates/academic/${id}`, params);
export const deleteAcademic = (id: number) => api.delete<void>(`/api/candidates/academic/${id}`);
export const createEmployment = (params: CreateEmployment.Params) => api.post<void>("/api/candidates/employment", params);
export const updateEmployment = (id: number, params: Partial<CreateEmployment.Params>) => api.patch<void>(`/api/candidates/employment/${id}`, params);
export const deleteEmployment = (id: number) => api.delete<void>(`/api/candidates/employment/${id}`);
export const createProfessionalLink = (params: CreateLink.Params) => api.post<void>("/api/candidates/professional", params);
export const deleteProfessionalLink = (id: number) => api.delete<void>(`/api/candidates/professional/${id}`);
export const createSocialLink = (params: CreateLink.Params) => api.post<void>("/api/candidates/social", params);
export const deleteSocialLink = (id: number) => api.delete<void>(`/api/candidates/social/${id}`);

// Habilidades e conhecimentos (catálogo mantido pela equipe)
export const getSkillsCatalog = () => api.get<CatalogItem.Item[]>("/api/candidates/skills-catalog");
export const getKnowledgesCatalog = () => api.get<CatalogItem.Item[]>("/api/candidates/knowledges-catalog");
export const addSkills = (skillIds: number[]) => api.post<void>("/api/candidates/skill", { candidate_skills_attributes: skillIds.map((skill_id) => ({ skill_id })) });
export const removeSkill = (candidateSkillId: number) => api.delete<void>(`/api/candidates/skill/${candidateSkillId}`);
export const addKnowledges = (knowledgeIds: number[]) => api.post<void>("/api/candidates/knowledge", { candidate_knowledges_attributes: knowledgeIds.map((knowledge_id) => ({ knowledge_id })) });
export const removeKnowledge = (candidateKnowledgeId: number) => api.delete<void>(`/api/candidates/knowledge/${candidateKnowledgeId}`);

// Currículo em PDF e importação (WP-42)
export async function uploadCurriculumFile(file: PickedFile): Promise<CurriculumData.Response> {
  return api.put<CurriculumData.Response>("/api/candidates/curriculum/file", await buildFileForm("file", file), MULTIPART);
}

export const deleteCurriculumFile = () => api.delete<CurriculumData.Response>("/api/candidates/curriculum/file");

export const getImportDraft = () => api.post<CurriculumImport.Draft>("/api/candidates/curriculum/import");

export const applyImport = (payload: CurriculumImport.ApplyPayload) => api.post<CurriculumData.Response>("/api/candidates/curriculum/import/apply", payload);
