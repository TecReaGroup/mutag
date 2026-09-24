import type { AudioFile, AudioTag } from "../audio-tags/contracts";
import type { ChatMessage } from "../chat/contracts";

export interface OrganiseLibraryResult {
  moves: { originalPath: string; path: string; name: string }[];
  messages: string[];
}

export interface MutagProjectState {
  selectedId: string;
  files: Record<string, { tempTags: AudioTag | null; pendingArtwork?: AudioFile["pendingArtwork"] }>;
  chatMessages: ChatMessage[];
}

export interface OpenFolderResult {
  root: string;
  files: AudioFile[];
  projectState: Partial<MutagProjectState> | null;
}
