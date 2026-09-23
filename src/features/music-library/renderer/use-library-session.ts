import { useCallback, useEffect, useState } from "react";
import type { AudioFile } from "../../audio-tags/contracts";
import type { ChatMessage } from "../../chat/contracts";
import type { OpenFolderResult } from "../contracts";
import { useAudioFiles } from "./use-audio-files";
import { errorMessage } from "../../../shared/renderer/error-message";

const MIN_SCAN_MS = 300;

/** Own folder restoration and keep file selection and conversation in one session. */
export function useLibrarySession(initialFiles: AudioFile[], ready: boolean, initialFolder: string, onFolderChange: (root: string) => void) {
  const audioFiles = useAudioFiles(initialFiles, initialFiles[1]?.id ?? initialFiles[0]?.id ?? "");
  const [root, setRoot] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { restoreFolder } = audioFiles;
  const restoreSession = useCallback((folder: OpenFolderResult) => {
    restoreFolder(folder);
    setRoot(folder.root);
    setMessages(folder.projectState?.chatMessages ?? []);
    onFolderChange(folder.root);
  }, [restoreFolder, onFolderChange]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const restore = async () => {
      try {
        const folder = initialFolder ? await window.audioTagApi?.openLastFolder(initialFolder) : null;
        if (!cancelled && folder) restoreSession(folder);
      } catch (failure) { if (!cancelled) setError(errorMessage(failure)); }
      finally { if (!cancelled) timer = setTimeout(() => setScanning(false), Math.max(0, MIN_SCAN_MS - (Date.now() - started))); }
    };
    void restore();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ready, initialFolder, restoreSession]);

  const openFolder = useCallback(async (flushProject: () => Promise<unknown>) => {
    if (!window.audioTagApi) return;
    setScanning(true); setError(null);
    const started = Date.now();
    try {
      await flushProject();
      const folder = await window.audioTagApi.openFolder();
      if (folder) restoreSession(folder);
    } catch (failure) { setError(errorMessage(failure)); }
    finally {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_SCAN_MS - (Date.now() - started))));
      setScanning(false);
    }
  }, [restoreSession]);
  return { ...audioFiles, root, messages, setMessages, scanning, error, openFolder };
}
