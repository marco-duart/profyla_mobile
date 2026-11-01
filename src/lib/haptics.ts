import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Feedback físico nunca pode quebrar um fluxo: erro de háptico é ignorado (web, simulador, aparelho sem motor).
function safe(run: () => Promise<void>): void {
  if (Platform.OS === "web") return;
  run().catch(() => undefined);
}

export const haptics = {
  /** Ao cruzar o limiar de um gesto. */
  tick: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Ao concluir uma ação. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Em caso de erro. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Seleção discreta (chips, escala). */
  select: () => safe(() => Haptics.selectionAsync()),
};
