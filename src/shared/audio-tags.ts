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

export interface MutagConfig {
  lastFolder: string;
  openAI: {
    baseURL: string;
    apiKey: string;
    model: string;
  };
  audioTag: {
    defaultFieldKeys: string[];
  };
  layout: {
    leftW: number;
    rightW: number;
  };
}

export interface MutagProjectState {
  selectedId: string;
  files: Record<string, {
    tempTags: AudioTag | null;
    tempDeleted: string[];
  }>;
  extraFields: { key: string; label: string }[];
  chatMessages: { role: "user" | "assistant" | "system"; content: string }[];
}

export interface OpenFolderResult {
  root: string;
  files: AudioFile[];
  projectState: Partial<MutagProjectState> | null;
}
