import type { AudioTag, SaveTagsResult } from "../features/audio-tags/contracts";
import type { ArtworkOutcome } from "../features/artwork/contracts";
import type { ModelConfig, MutagConfig } from "../features/settings/contracts";
import type { MutagProjectState, OpenFolderResult, OrganiseLibraryResult } from "../features/music-library/contracts";

export interface DesktopApi {
  openFolder: () => Promise<OpenFolderResult | null>;
  openLastFolder: (root: string) => Promise<OpenFolderResult | null>;
  organise: (root: string) => Promise<OrganiseLibraryResult>;
  downloadImages: (root: string, model: ModelConfig) => Promise<ArtworkOutcome>;
  generateImages: (root: string, model: ModelConfig, requestId: string) => Promise<ArtworkOutcome>;
  cancelImageGeneration: (requestId: string) => void;
  generateLyrics: (root: string, model: ModelConfig, paths: string[]) => Promise<{ updates: { path: string; lyrics: string }[]; messages: string[] }>;
  loadConfig: () => Promise<Partial<MutagConfig> | null>;
  saveConfig: (config: MutagConfig) => Promise<{ ok: true }>;
  saveProjectState: (root: string, state: MutagProjectState) => Promise<{ ok: true }>;
  saveTags: (path: string, tags: AudioTag) => Promise<SaveTagsResult>;
  acceptArtwork: (path: string, tags: AudioTag, token: string) => Promise<SaveTagsResult>;
  discardArtwork: (path: string, token: string) => Promise<void>;
  importImage: () => Promise<{ ok: true; image: string } | { ok: false; error?: string; canceled?: boolean }>;
  exportImage: (path: string) => Promise<{ ok: true; path: string } | { ok: false; error?: string; canceled?: boolean }>;
}
