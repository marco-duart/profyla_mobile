import { Platform } from "react-native";

export type PickedFile = { uri: string; name: string; mimeType: string };

/**
 * Parte de arquivo para FormData. No React Native o FormData aceita `{ uri, name, type }`;
 * na web (só desenvolvimento) é preciso um Blob de verdade.
 */
export async function toFormFile(file: PickedFile): Promise<Blob> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    return blob;
  }
  return { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
}

export async function buildFileForm(field: string, file: PickedFile): Promise<FormData> {
  const form = new FormData();
  const part = await toFormFile(file);
  if (Platform.OS === "web") form.append(field, part, file.name);
  else form.append(field, part);
  return form;
}

// O Rails recebe multipart: o Content-Type (com o boundary) precisa ser montado pelo cliente HTTP.
export const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } } as const;
