import type { ModelConfig } from "../contracts";

export const DEFAULT_MODEL: ModelConfig = {
  baseURL: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini",
  filesPerRequest: 5, concurrency: 1, timeoutSeconds: 200,
  uploadAudio: false, webSearch: false, imageGeneration: false,
};
export const DEFAULT_LAYOUT = { leftW: 224, rightW: 208 };

export function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

/** Normalize persisted and edited model settings at their boundary. */
export function normalizeModel(profile: ModelConfig): ModelConfig {
  return {
    ...DEFAULT_MODEL, ...profile,
    model: profile.model.trim(), baseURL: profile.baseURL.trim(),
    filesPerRequest: positiveInteger(profile.filesPerRequest, DEFAULT_MODEL.filesPerRequest),
    concurrency: positiveInteger(profile.concurrency, DEFAULT_MODEL.concurrency),
    timeoutSeconds: positiveInteger(profile.timeoutSeconds, DEFAULT_MODEL.timeoutSeconds),
    uploadAudio: profile.uploadAudio === true,
    webSearch: profile.webSearch === true,
    imageGeneration: /image/i.test(profile.model) && profile.imageGeneration === true,
  };
}
