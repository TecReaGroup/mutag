import fs from "node:fs/promises";
import path from "node:path";
import lyricPrompt from "../../../../data/prompt/lyris_prompt.md?raw";
import { validateLrc } from "./lrc.js";
import { requestGeminiContent } from "../../../shared/llm/gemini-content.js";

const AUDIO_MIME_TYPES = { ".aac": "audio/aac", ".flac": "audio/flac", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };
const MAX_REQUEST_BYTES = 20 * 1024 * 1024;

/** Generate one complete transcription through the native Gemini endpoint. */
export async function requestLyrics(file, model) {
  const parts = [{ text: `${lyricPrompt}\n音频上传：${model.uploadAudio ? "开启" : "关闭"}；联网搜索：${model.webSearch ? "开启" : "关闭"}。\n歌曲信息：${JSON.stringify({ name: file.name, title: file.savedTags.title, artist: file.savedTags.artist, album: file.savedTags.album })}` }];
  if (model.uploadAudio) {
    const mimeType = AUDIO_MIME_TYPES[path.extname(file.path).toLowerCase()];
    if (!mimeType) throw new Error("Gemini 音频上传不支持此文件格式。");
    if ((await fs.stat(file.path)).size * 4 / 3 >= MAX_REQUEST_BYTES) throw new Error("音频超过 Gemini 内联上传的 20 MiB 请求限制。");
    parts.push({ inlineData: { mimeType, data: (await fs.readFile(file.path)).toString("base64") } });
  }
  const body = JSON.stringify({ contents: [{ role: "user", parts }], ...(model.webSearch ? { tools: [{ googleSearch: {} }] } : {}) });
  if (Buffer.byteLength(body) >= MAX_REQUEST_BYTES) throw new Error("歌词请求超过 Gemini 内联上传的 20 MiB 限制。");
  const lyrics = await requestGeminiContent(model, [{ role: "user", parts }], undefined);
  return validateLrc(lyrics);
}
