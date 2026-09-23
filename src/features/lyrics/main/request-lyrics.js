import lyricPrompt from "../../../../data/prompt/lyris_prompt.md?raw";
import { validateLrc } from "./lrc.js";
import { requestGeminiContent } from "../../../shared/llm/gemini-content.js";
import { prepareLyricsAudio } from "./prepare-lyrics-audio.js";

const MAX_REQUEST_BYTES = 20 * 1024 * 1024;
const REQUEST_RESERVE_BYTES = 1024;

/** Generate one complete transcription through the native Gemini endpoint. */
export async function requestLyrics(file, model) {
  const parts = [{ text: `${lyricPrompt}\n音频上传：${model.uploadAudio ? "开启" : "关闭"}；联网搜索：${model.webSearch ? "开启" : "关闭"}。\n歌曲信息：${JSON.stringify({ name: file.name, title: file.savedTags.title, artist: file.savedTags.artist, album: file.savedTags.album })}` }];
  if (model.uploadAudio) {
    const requestOverhead = Buffer.byteLength(JSON.stringify({ contents: [{ role: "user", parts }], ...(model.webSearch ? { tools: [{ googleSearch: {} }] } : {}) })) + REQUEST_RESERVE_BYTES;
    const maxAudioBytes = Math.floor((MAX_REQUEST_BYTES - requestOverhead - 1) / 4) * 3;
    if (maxAudioBytes <= 0) throw new Error("歌词提示词和歌曲信息超过 Gemini 请求限制。");
    parts.push({ inlineData: await prepareLyricsAudio(file.path, maxAudioBytes) });
  }
  const body = JSON.stringify({ contents: [{ role: "user", parts }], ...(model.webSearch ? { tools: [{ googleSearch: {} }] } : {}) });
  if (Buffer.byteLength(body) >= MAX_REQUEST_BYTES) throw new Error("歌词请求超过 Gemini 内联上传的 20 MiB 限制。");
  const lyrics = await requestGeminiContent(model, [{ role: "user", parts }], undefined);
  return validateLrc(lyrics);
}
