import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

/** Anuncia o título do passo ao avançar: o leitor de tela "cai" no passo novo (plano, seção 11). */
export function useAnnounce(title: string): void {
  useEffect(() => {
    const handle = setTimeout(() => AccessibilityInfo.announceForAccessibility(title), 300);
    return () => clearTimeout(handle);
  }, [title]);
}
