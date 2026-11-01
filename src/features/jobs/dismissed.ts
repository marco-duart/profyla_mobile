import { KEYS, readJson, writeJson } from "@/lib/localStore";

export type DismissedJob = { id: number; title: string; company: string };

// Vagas dispensadas ficam só no aparelho na v1 (D-M05): reversível e sem backend.
export async function loadDismissed(): Promise<DismissedJob[]> {
  return readJson<DismissedJob[]>(KEYS.dismissedJobs, []);
}

export const addDismissed = (list: DismissedJob[], job: DismissedJob): DismissedJob[] => (list.some((item) => item.id === job.id) ? list : [...list, job]);

export const removeDismissed = (list: DismissedJob[], id: number): DismissedJob[] => list.filter((item) => item.id !== id);

export async function saveDismissed(list: DismissedJob[]): Promise<void> {
  await writeJson(KEYS.dismissedJobs, list);
}
