import type { PendingArtwork } from "../artwork/contracts";

export interface AudioTag {
  image: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  bpm: string;
  comment: string;
  [key: string]: string;
}

export interface AudioFile {
  pendingArtwork?: PendingArtwork | null;
  id: string;
  name: string;
  path: string;
  savedTags: AudioTag;
  tempTags: AudioTag | null;
}

export type SaveTagsResult =
  | {
      ok: true;
      tags: AudioTag;
      path: string;
      name: string;
    }
  | {
      ok: false;
      error: string;
    };
