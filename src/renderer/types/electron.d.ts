import type { AudioFile, AudioTag, SaveTagsResult } from "@/shared/audio-tags";

declare global {
  interface Window {
    audioTagApi?: {
      openFolder: () => Promise<AudioFile[]>;
      saveTags: (path: string, tags: AudioTag, deleted: string[]) => Promise<SaveTagsResult>;
    };
  }
}

export {};
