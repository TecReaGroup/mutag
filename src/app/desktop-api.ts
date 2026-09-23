import type { AudioTag, SaveTagsResult } from "../features/audio-tags/contracts";
import type { ModelConfig, MutagConfig } from "../features/settings/contracts";
import type { MutagProjectState, OpenFolderResult, OrganiseLibraryResult } from "../features/music-library/contracts";

export interface DesktopApi {
  openFolder: () => Promise<OpenFolderResult | null>;
  openLastFolder: (root: string) => Promise<OpenFolderResult | null>;
  organise: (root: string) => Promise<OrganiseLibraryResult>;
  downloadImages: (root: string, model: ModelConfig) => Promise<{ messages: string[] }>;
  generateLyrics: (root: string, model: ModelConfig) => Promise<{ updates: { path: string; lyrics: string }[]; messages: string[] }>;
  loadConfig: () => Promise<Partial<MutagConfig> | null>;
  saveConfig: (config: MutagConfig) => Promise<{ ok: true }>;
  saveProjectState: (root: string, state: MutagProjectState) => Promise<{ ok: true }>;
  saveTags: (path: string, tags: AudioTag) => Promise<SaveTagsResult>;
  importImage: () => Promise<{ ok: true; image: string } | { ok: false; error?: string; canceled?: boolean }>;
  exportImage: (path: string) => Promise<{ ok: true; path: string } | { ok: false; error?: string; canceled?: boolean }>;
}
