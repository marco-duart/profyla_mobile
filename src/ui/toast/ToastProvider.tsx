import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "@/lib/haptics";
import { Button } from "../Button";
import { Text } from "../Text";
import { colors, space } from "../tokens";
import { UndoManager, type UndoableAction } from "./UndoManager";
import { t } from "@/i18n/pt-BR";

type Tone = "info" | "success" | "error";
type Message = { id: number; text: string; tone: Tone };

type ToastApi = {
  show: (text: string, tone?: Tone) => void;
  /** Ação reversível: acontece na hora e o aviso oferece t.undo (D-M08). */
  undoable: (action: UndoableAction) => void;
  /** Confirma agora o que estiver pendente (logout, segundo plano). */
  flushUndo: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TAB_BAR_ALLOWANCE = 76;

export function ToastProvider({ children, manager }: { children: ReactNode; manager?: UndoManager }) {
  const insets = useSafeAreaInsets();
  const undoManager = useMemo(() => manager ?? new UndoManager(), [manager]);
  const undoMessage = useSyncExternalStore(undoManager.subscribe, undoManager.getMessage, undoManager.getMessage);
  const [message, setMessage] = useState<Message | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, tone: Tone = "info") => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setMessage({ id: counter.current, text, tone });
    if (tone === "error") haptics.error();
    if (tone === "success") haptics.success();
    timer.current = setTimeout(() => setMessage(null), 3500);
  }, []);

  // Enviar para o servidor o que estiver pendente quando o app sai de cena: o usuário não perde a ação.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") undoManager.flush();
    });
    return () => subscription.remove();
  }, [undoManager]);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      undoable: (action) => {
        setMessage(null);
        undoManager.run(action);
      },
      flushUndo: () => undoManager.flush(),
    }),
    [show, undoManager],
  );

  const bottom = insets.bottom + TAB_BAR_ALLOWANCE;
  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { bottom }]}>
        {undoMessage ? (
          <View style={[styles.toast, styles.info]} accessibilityLiveRegion="polite">
            <Text variant="bodyStrong" style={styles.text}>{undoMessage}</Text>
            <Button label={t.undo} variant="ghost" onPress={() => undoManager.undo()} />
          </View>
        ) : message ? (
          <View
            key={message.id}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, message.tone === "error" ? styles.error : message.tone === "success" ? styles.success : styles.info]}
          >
            <Text variant="bodyStrong" style={styles.text}>{message.text}</Text>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast precisa de <ToastProvider>.");
  return context;
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: space[4], right: space[4], alignItems: "stretch" },
  toast: { flexDirection: "row", alignItems: "center", gap: space[3], paddingLeft: space[4], paddingRight: space[2], paddingVertical: space[2], borderWidth: 1, minHeight: 56 },
  text: { flex: 1 },
  info: { backgroundColor: colors.canvasAlt, borderColor: colors.borderStrong },
  success: { backgroundColor: colors.successSubtle, borderColor: colors.success },
  error: { backgroundColor: colors.errorSubtle, borderColor: colors.error },
});
