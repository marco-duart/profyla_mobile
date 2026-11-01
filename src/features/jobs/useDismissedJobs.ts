import { useCallback, useEffect, useState } from "react";
import { addDismissed, loadDismissed, removeDismissed, saveDismissed, type DismissedJob } from "./dismissed";

export function useDismissedJobs() {
  const [dismissed, setDismissed] = useState<DismissedJob[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadDismissed().then((list) => {
      if (!active) return;
      setDismissed(list);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = useCallback((job: DismissedJob) => {
    setDismissed((current) => {
      const next = addDismissed(current, job);
      void saveDismissed(next);
      return next;
    });
  }, []);

  const restore = useCallback((id: number) => {
    setDismissed((current) => {
      const next = removeDismissed(current, id);
      void saveDismissed(next);
      return next;
    });
  }, []);

  return { dismissed, ready, dismiss, restore };
}
