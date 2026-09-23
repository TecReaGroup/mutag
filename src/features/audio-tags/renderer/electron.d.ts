import type { AudioTag, MutagConfig, MutagProjectState, OpenFolderResult, OrganiseLibraryResult, SaveTagsResult } from "../contracts";

declare global {
  interface Window {
    audioTagApi?: {
      openFolder: () => Promise<OpenFolderResult | null>;
      openLastFolder: (root: string) => Promise<OpenFolderResult | null>;
      organise: (root: string) => Promise<OrganiseLibraryResult>;
      downloadImages: (root: string, openAI: MutagConfig["openAI"]) => Promise<{ messages: string[] }>;
      loadConfig: () => Promise<Partial<MutagConfig> | null>;
      saveConfig: (config: MutagConfig) => Promise<{ ok: true }>;
      saveProjectState: (root: string, state: MutagProjectState) => Promise<{ ok: true }>;
      saveTags: (path: string, tags: AudioTag) => Promise<SaveTagsResult>;
      importImage: () => Promise<{ ok: true; image: string } | { ok: false; error?: string; canceled?: boolean }>;
      exportImage: (path: string) => Promise<{ ok: true; path: string } | { ok: false; error?: string; canceled?: boolean }>;
    };
  }
}

export {};
