import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelConfig, MutagConfig, WebdavConfig } from "../contracts";
import type { Language } from "../../../shared/localization";
import { DEFAULT_FIELD_KEYS, normalizeTagKey } from "../../audio-tags/renderer/tag-fields";
import { DEFAULT_LAYOUT, DEFAULT_MODEL, normalizeModel } from "./model-config";

const CONFIG_SAVE_DELAY_MS = 250;
const DEFAULT_WEBDAV: WebdavConfig = { url: "", username: "", password: "", directory: "mutag/" };
const INITIAL_CONFIG: MutagConfig = {
  language: "en", lastFolder: "", openAI: DEFAULT_MODEL, models: [],
  audioTag: { defaultFieldKeys: DEFAULT_FIELD_KEYS }, layout: DEFAULT_LAYOUT, webdav: DEFAULT_WEBDAV,
};

/** Normalize a stored or downloaded configuration snapshot at its boundary. */
function normalizeConfig(stored: Partial<MutagConfig>): MutagConfig {
  const openAI = stored.openAI ? normalizeModel(stored.openAI) : DEFAULT_MODEL;
  const profiles = stored.models ?? (stored.openAI ? [stored.openAI] : []);
  const models = Array.from(new Map(profiles.map(normalizeModel).filter((profile) => profile.model).map((profile) => [profile.model, profile])).values());
  const defaultKeys = stored.audioTag?.defaultFieldKeys ?? DEFAULT_FIELD_KEYS;
  return {
    ...INITIAL_CONFIG, lastFolder: stored.lastFolder ?? "",
    disabledCommands: Array.isArray(stored.disabledCommands) ? [...new Set(stored.disabledCommands.filter((name) => typeof name === "string"))] : [],
    language: stored.language === "zh-CN" ? "zh-CN" : "en", openAI, models,
    audioTag: { defaultFieldKeys: [...new Set(defaultKeys.map(normalizeTagKey))] },
    layout: { ...DEFAULT_LAYOUT, ...stored.layout },
    webdav: { ...DEFAULT_WEBDAV, ...stored.webdav },
  };
}

/** Own preference restoration and serialized, debounced persistence. */
export function usePreferences() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFolder = useRef("");
  const restorationFailed = useRef(false);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const stored = await window.audioTagApi?.loadConfig();
        if (cancelled || !stored) return;
        const restored = normalizeConfig(stored);
        initialFolder.current = restored.lastFolder;
        setConfig(restored);
      } catch (failure) {
        restorationFailed.current = true;
        if (!cancelled) setError(String(failure));
      } finally { if (!cancelled) setLoaded(true); }
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || restorationFailed.current || !window.audioTagApi) return;
    const api = window.audioTagApi;
    const timer = setTimeout(() => {
      writes.current = writes.current.catch(() => undefined).then(() => api.saveConfig(config));
      void writes.current.then(() => setError(null), (failure) => setError(String(failure)));
    }, CONFIG_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [config, loaded]);

  const setLanguage = useCallback((language: Language) => setConfig((previous) => ({ ...previous, language })), []);
  const setDisabledCommands = useCallback((disabledCommands: string[]) => setConfig((previous) => ({ ...previous, disabledCommands })), []);
  const setDefaultKeys = useCallback((defaultFieldKeys: string[]) => setConfig((previous) => ({ ...previous, audioTag: { defaultFieldKeys } })), []);
  const setModels = useCallback((models: ModelConfig[], openAI: ModelConfig) => setConfig((previous) => ({ ...previous, models, openAI })), []);
  const selectModel = useCallback((openAI: ModelConfig) => setConfig((previous) => ({ ...previous, openAI })), []);
  const setLastFolder = useCallback((lastFolder: string) => setConfig((previous) => ({ ...previous, lastFolder })), []);
  const setWebdav = useCallback((webdav: WebdavConfig) => setConfig((previous) => ({ ...previous, webdav })), []);
  const uploadBackup = useCallback(async () => {
    const { lastFolder: _lastFolder, webdav, ...backup } = config;
    return window.audioTagApi!.uploadConfigBackup(webdav, backup);
  }, [config]);
  const restoreBackup = useCallback(async () => {
    const backup = await window.audioTagApi!.downloadConfigBackup(config.webdav);
    setConfig((previous) => ({ ...normalizeConfig(backup), lastFolder: previous.lastFolder, webdav: previous.webdav }));
  }, [config.webdav]);
  const resizeLeft = useCallback((delta: number) => setConfig((previous) => ({ ...previous, layout: { ...previous.layout, leftW: Math.max(120, Math.min(480, previous.layout.leftW + delta)) } })), []);
  const resizeRight = useCallback((delta: number) => setConfig((previous) => ({ ...previous, layout: { ...previous.layout, rightW: Math.max(120, Math.min(480, previous.layout.rightW - delta)) } })), []);
  return { config, loaded, initialFolder: initialFolder.current, error, setLanguage, setDisabledCommands, setDefaultKeys, setModels, selectModel, setLastFolder, setWebdav, uploadBackup, restoreBackup, resizeLeft, resizeRight };
}
