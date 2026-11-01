import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

/** Grava o texto num arquivo do cache do app e abre a folha de compartilhamento do sistema (sem cópia em pasta pública). */
export async function shareTextFile(filename: string, content: string, mimeType: string, dialogTitle: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
  return true;
}
