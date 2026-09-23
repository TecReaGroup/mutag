export type Language = "en" | "zh-CN";
export type Translate = (english: string, chinese: string) => string;

export const LANGUAGE_OPTIONS = [
  { key: "en", label: "English", value: "en" },
  { key: "zh-CN", label: "简体中文", value: "zh-CN" },
] as const;
