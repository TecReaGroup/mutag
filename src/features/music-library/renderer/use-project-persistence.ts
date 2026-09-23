import { useCallback, useEffect, useRef, useState } from "react";
import type { MutagProjectState } from "../contracts";
import { errorMessage } from "../../../shared/renderer/error-message";

const PROJECT_SAVE_DELAY_MS = 250;

/** Own pending snapshots and flush them before commands change file paths. */
export function useProjectPersistence(root: string, state: MutagProjectState, enabled: boolean) {
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ root: string; state: MutagProjectState } | null>(null);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const snapshot = pending.current;
    pending.current = null;
    if (snapshot && window.audioTagApi) {
      const api = window.audioTagApi;
      writes.current = writes.current.catch(() => undefined)
        .then(() => api.saveProjectState(snapshot.root, snapshot.state));
    }
    return writes.current;
  }, []);
  useEffect(() => {
    if (!enabled || !root || !window.audioTagApi) return;
    pending.current = { root, state };
    timer.current = setTimeout(() => {
      void flush().then(() => setError(null), (failure) => setError(errorMessage(failure)));
    }, PROJECT_SAVE_DELAY_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [root, state, enabled, flush]);
  useEffect(() => () => {
    void flush().catch((error) => console.warn("Failed to save project state", error));
  }, [flush]);
  return { flush, error };
}
