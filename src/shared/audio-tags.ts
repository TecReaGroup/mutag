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
  id: string;
  name: string;
  path: string;
  savedTags: AudioTag;
  tempTags: AudioTag | null;
}

export interface OrganiseLibraryResult {
  moves: { originalPath: string; path: string; name: string }[];
  messages: string[];
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
  language?: "en" | "zh-CN";
  models?: MutagConfig["openAI"][];
  lastFolder: string;
  openAI: {
    baseURL: string;
    apiKey: string;
    model: string;
    filesPerRequest: number;
    concurrency: number;
    timeoutSeconds: number;
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
  }>;
  chatMessages: { role: "user" | "assistant" | "system"; content: string }[];
}

export interface OpenFolderResult {
  root: string;
  files: AudioFile[];
  projectState: Partial<MutagProjectState> | null;
}
