import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AudioFile, AudioTag } from "../contracts";
import { getTagValue, hasTagChanges, normalizeTagKey } from "./tag-fields";
import { errorMessage } from "../../../shared/renderer/error-message";

interface TagEditingSource {
  files: AudioFile[]; selectedId: string; setFiles: Dispatch<SetStateAction<AudioFile[]>>;
  applySavedFile: (originalId: string, saved: { tags: AudioTag; path: string; name: string }) => void;
}

/** Own edits and serialize save operations, retaining successful writes on partial failure. */
export function useTagEditing({ files, selectedId, setFiles, applySavedFile }: TagEditingSource, blocked: boolean) {
  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const selectedFile = files.find((file) => file.id === selectedId);
  useEffect(() => { setError(null); }, [selectedId]);
  const updateField = useCallback((field: string, value: string) => {
    if (blocked || saving.current) return;
    const key = normalizeTagKey(field);
    setError(null);
    setFiles((previous) => previous.map((file) => file.id === selectedId ? { ...file, tempTags: { ...(file.tempTags ?? file.savedTags), [key]: value } } : file));
  }, [blocked, selectedId, setFiles]);
  const addField = (key: string) => {
    if (blocked || saving.current) return;
    setExtraKeys((previous) => previous.includes(key) ? previous : [...previous, key]);
    updateField(key, "");
  };
  const saveFiles = async (changedFiles: AudioFile[]) => {
    if (blocked || saving.current || !changedFiles.length) return;
    saving.current = true; setError(null); setProgress({ done: 0, total: changedFiles.length });
    const savedTags = new Map<string, AudioTag>();
    try {
      for (const [index, file] of changedFiles.entries()) {
        const tags = { ...(file.tempTags ?? file.savedTags) };
        const api = window.audioTagApi;
        const saved = api ? await (file.pendingArtwork ? api.acceptArtwork(file.path, tags, file.pendingArtwork.token) : api.saveTags(file.path, tags)) : { ok: true as const, tags, path: file.path, name: file.name };
        if (!saved.ok) throw new Error(saved.error);
        applySavedFile(file.id, saved);
        savedTags.set(file.id, saved.tags);
        setProgress({ done: index + 1, total: changedFiles.length });
      }
      setExtraKeys((previous) => previous.filter((key) => files.some((file) => getTagValue(savedTags.get(file.id) ?? file.tempTags ?? file.savedTags, key) !== "")));
    } catch (failure) { setError(errorMessage(failure)); }
    finally { saving.current = false; setProgress(null); }
  };
  const saveSelected = () => saveFiles(selectedFile && hasTagChanges(selectedFile) ? [selectedFile] : []);
  const saveAll = () => saveFiles(files.filter(hasTagChanges));
  const discardFiles = async (changedFiles: AudioFile[]) => {
    if (blocked || saving.current || !changedFiles.length) return;
    saving.current = true; setError(null); setProgress({ done: 0, total: changedFiles.length });
    try {
      for (const [index, file] of changedFiles.entries()) {
        if (file.pendingArtwork) await window.audioTagApi?.discardArtwork(file.path, file.pendingArtwork.token);
        setFiles((previous) => previous.map((entry) => entry.id === file.id ? { ...entry, tempTags: null, pendingArtwork: null } : entry));
        setProgress({ done: index + 1, total: changedFiles.length });
      }
    } catch (failure) { setError(errorMessage(failure)); }
    finally { saving.current = false; setProgress(null); }
  };
  const discardSelected = () => discardFiles(selectedFile ? [selectedFile] : []);
  const discardAll = () => discardFiles(files.filter(hasTagChanges));
  const importImage = async () => {
    if (blocked || saving.current || !selectedFile) return;
    setError(null);
    try {
      const imported = await window.audioTagApi?.importImage();
      if (imported?.ok) updateField("image", imported.image);
      else if (imported && !imported.canceled && imported.error) setError(imported.error);
    } catch (failure) { setError(errorMessage(failure)); }
  };
  const exportImage = async () => {
    if (blocked || saving.current || !selectedFile) return;
    setError(null);
    try {
      const exported = await window.audioTagApi?.exportImage(selectedFile.path);
      if (exported && !exported.ok && !exported.canceled && exported.error) setError(exported.error);
    } catch (failure) { setError(errorMessage(failure)); }
  };
  return { extraKeys, progress, error, dismissError: () => setError(null), updateField, addField, saveSelected, saveAll, discardSelected, discardAll, importImage, exportImage };
}
