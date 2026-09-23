import { createRequire } from "node:module";
import { resolveProjectRoot } from "../../music-library/main/library-paths.js";
import { scanFolder } from "../../music-library/main/scan-audio-folder.js";
import { logEvent } from "../../../shared/main/logging.js";
import { requestLyrics } from "./request-lyrics.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Generate missing lyrics for review with bounded concurrency. */
export function registerLyricsIpc() {
  ipcMain.handle("audio-tags:generate-lyrics", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    if (!Array.isArray(payload.paths) || payload.paths.some((filePath) => typeof filePath !== "string")) throw new Error("歌词生成文件列表无效。");
    const model = payload.openAI;
    if (!model || typeof model.model !== "string" || !/gemini/i.test(model.model)) throw new Error("请在 Settings 中选择 Gemini 模型生成歌词。");
    if (typeof model.baseURL !== "string" || !/^https?:\/\//.test(model.baseURL)) throw new Error("请设置有效的模型接口地址。");
    if (!Number.isSafeInteger(model.concurrency) || model.concurrency < 1 || !Number.isSafeInteger(model.timeoutSeconds) || model.timeoutSeconds < 1) throw new Error("模型并发数和超时设置无效。");
    const configuration = { ...model, uploadAudio: model.uploadAudio === true, webSearch: model.webSearch === true };
    const folder = await scanFolder(root);
    const requestedPaths = new Set(payload.paths);
    const files = folder.files.filter((file) => requestedPaths.has(file.path) && !file.savedTags.lyrics?.trim() && !file.tempTags?.lyrics?.trim());
    const skippedCount = folder.files.length - files.length;
    const updates = [];
    const failures = [];
    let nextFile = 0;
    logEvent("INFO", "lyrics", `开始生成待审阅歌词，文件数=${files.length}，跳过=${skippedCount}，上传=${configuration.uploadAudio}，搜索=${configuration.webSearch}`);
    await Promise.all(Array.from({ length: Math.min(model.concurrency, files.length) }, async () => {
      while (nextFile < files.length) {
        const file = files[nextFile++];
        try {
          const lyrics = await requestLyrics(file, configuration);
          updates.push({ path: file.path, lyrics });
          logEvent("INFO", "lyrics", `歌词已生成，待审阅：${file.path}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${file.name}：${message}`);
          logEvent("ERROR", "lyrics", `生成失败 ${file.path}：${message}`);
        }
      }
    }));
    logEvent("INFO", "lyrics", `歌词生成结束，待审阅=${updates.length}，跳过=${skippedCount}，失败=${failures.length}`);
    return { updates, messages: [`歌词生成完成：${updates.length} 首产生待审阅修改，${skippedCount} 首跳过，${failures.length} 首失败。请审阅后保存。`, ...failures] };
  });
}
