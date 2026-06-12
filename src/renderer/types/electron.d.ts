import type { AudioTag, MutagConfig, MutagProjectState, OpenFolderResult, SaveTagsResult } from "@/shared/audio-tags";

declare global {
  interface Window {
    audioTagApi?: {
      openFolder: () => Promise<OpenFolderResult | null>;
      openLastFolder: (root: string) => Promise<OpenFolderResult | null>;
      loadConfig: () => Promise<Partial<MutagConfig> | null>;
      saveConfig: (config: MutagConfig) => Promise<{ ok: true }>;
      saveProjectState: (root: string, state: MutagProjectState) => Promise<{ ok: true }>;
      saveTags: (path: string, tags: AudioTag, deleted: string[]) => Promise<SaveTagsResult>;
    };
  }
}

export {};
