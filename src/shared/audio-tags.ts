export interface AudioTag {
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
  id: string;
  name: string;
  path: string;
  savedTags: AudioTag;
  tempTags: AudioTag | null;
  tempDeleted: string[];
}

export interface SaveTagsResult {
  ok: true;
  tags: AudioTag;
}
