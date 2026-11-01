import { useCallback, useEffect, useState } from "react";
import { HINT_MAX_VIEWS } from "@/gestures/config";
import { KEYS, readJson, writeJson } from "@/lib/localStore";

/** A dica do gesto aparece nas primeiras vezes e some depois do primeiro gesto de verdade (plano, seção 5). */
export function useGestureHint(): { show: boolean; markUsed: () => void } {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    readJson<number>(KEYS.gestureHintViews, 0).then((count) => {
      if (!active) return;
      setViews(count);
      if (count < HINT_MAX_VIEWS) void writeJson(KEYS.gestureHintViews, count + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  const markUsed = useCallback(() => {
    setViews(HINT_MAX_VIEWS);
    void writeJson(KEYS.gestureHintViews, HINT_MAX_VIEWS);
  }, []);

  return { show: views !== null && views < HINT_MAX_VIEWS, markUsed };
}
