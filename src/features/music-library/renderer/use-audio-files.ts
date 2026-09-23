import { useCallback, useState } from "react";
import type { AudioFile, AudioTag } from "../../audio-tags/contracts";
import type { OpenFolderResult } from "../contracts";

/** Own file selection and the state transition after a successful save. */
export function useAudioFiles(initialFiles: AudioFile[], initialSelectedId: string) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const restoreFolder = useCallback((folder: OpenFolderResult) => {
    setFiles(folder.files);
    const selection = folder.projectState?.selectedId;
    setSelectedId(selection && folder.files.some((file) => file.id === selection)
      ? selection : folder.files[0]?.id ?? "");
  }, []);
  const applySavedFile = useCallback((originalId: string, saved: { tags: AudioTag; path: string; name: string }) => {
    setFiles((previous) => previous.map((file) => file.id === originalId
      ? { ...file, id: saved.path, path: saved.path, name: saved.name, savedTags: saved.tags, tempTags: null }
      : file));
    setSelectedId((previous) => previous === originalId ? saved.path : previous);
  }, []);
  return { files, setFiles, selectedId, setSelectedId, restoreFolder, applySavedFile };
}
