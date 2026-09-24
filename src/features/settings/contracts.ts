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

export interface MutagConfig {
  disabledCommands?: string[];
  language?: "en" | "zh-CN";
  models?: ModelConfig[];
  lastFolder: string;
  openAI: ModelConfig;
  audioTag: { defaultFieldKeys: string[] };
  layout: { leftW: number; rightW: number };
}
