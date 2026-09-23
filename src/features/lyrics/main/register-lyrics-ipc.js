import { createRequire } from "node:module";
import { resolveProjectRoot } from "../../music-library/main/library-paths.js";
import { scanFolder } from "../../music-library/main/scan-audio-folder.js";
import { writeLyrics } from "../../audio-tags/main/audio-tag-storage.js";
import { logEvent } from "../../../shared/main/logging.js";
import { requestLyrics } from "./request-lyrics.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Generate and persist lyrics for the current library with bounded concurrency. */
export function registerLyricsIpc() {
  ipcMain.handle("audio-tags:generate-lyrics", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    const model = payload.openAI;
    if (!model || typeof model.model !== "string" || !/gemini/i.test(model.model)) throw new Error("请在 Settings 中选择 Gemini 模型生成歌词。");
    if (typeof model.baseURL !== "string" || !/^https?:\/\//.test(model.baseURL)) throw new Error("请设置有效的模型接口地址。");
    if (!Number.isSafeInteger(model.concurrency) || model.concurrency < 1 || !Number.isSafeInteger(model.timeoutSeconds) || model.timeoutSeconds < 1) throw new Error("模型并发数和超时设置无效。");
    const configuration = { ...model, uploadAudio: model.uploadAudio === true, webSearch: model.webSearch === true };
    const folder = await scanFolder(root);
    const updates = [];
    const failures = [];
    let nextFile = 0;
    logEvent("INFO", "lyrics", `开始生成歌词，文件数=${folder.files.length}，上传=${configuration.uploadAudio}，搜索=${configuration.webSearch}`);
    await Promise.all(Array.from({ length: Math.min(model.concurrency, folder.files.length) }, async () => {
      while (nextFile < folder.files.length) {
        const file = folder.files[nextFile++];
        try {
          const lyrics = await requestLyrics(file, configuration);
          writeLyrics(file.path, lyrics);
          updates.push({ path: file.path, lyrics });
          logEvent("INFO", "lyrics", `歌词已写入：${file.path}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${file.name}：${message}`);
          logEvent("ERROR", "lyrics", `生成失败 ${file.path}：${message}`);
        }
      }
    }));
    logEvent("INFO", "lyrics", `歌词生成结束，成功=${updates.length}，失败=${failures.length}`);
    return { updates, messages: [`歌词生成完成：${updates.length} 首已写入音频标签，${failures.length} 首失败。`, ...failures] };
  });
}
