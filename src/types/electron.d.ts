interface AudioTag {
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  bpm: string;
  comment: string;
  [key: string]: string;
}

interface AudioFile {
  id: string;
  name: string;
  path: string;
  savedTags: AudioTag;
  tempTags: AudioTag | null;
  tempDeleted: string[];
}

interface Window {
  audioTagApi?: {
    openFolder: () => Promise<AudioFile[]>;
    saveTags: (path: string, tags: AudioTag, deleted: string[]) => Promise<{ ok: true }>;
  };
}
