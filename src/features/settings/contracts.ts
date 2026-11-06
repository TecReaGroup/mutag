import type { Language } from "../../shared/localization";

export interface ModelConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  filesPerRequest: number;
  concurrency: number;
  timeoutSeconds: number;
  uploadAudio: boolean;
  webSearch: boolean;
  imageGeneration: boolean;
}

export interface WebdavConfig {
  url: string;
  username: string;
  password: string;
  directory: string;
}

export interface MutagConfig {
  disabledCommands?: string[];
  language?: Language;
  models?: ModelConfig[];
  lastFolder: string;
  openAI: ModelConfig;
  audioTag: { defaultFieldKeys: string[] };
  layout: { leftW: number; rightW: number };
  webdav: WebdavConfig;
}

/** Machine-specific state and the WebDAV credentials themselves never leave this device. */
export type ConfigBackup = Omit<MutagConfig, "lastFolder" | "webdav">;
