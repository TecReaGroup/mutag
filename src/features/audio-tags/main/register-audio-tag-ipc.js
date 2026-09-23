import { createRequire } from "node:module";
import { writeTags, importCoverImage, exportCoverImage } from "./audio-tag-storage.js";
import { logEvent } from "../../../shared/main/logging.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register tag editing and embedded cover operations. */
export function registerAudioTagIpc() {
  ipcMain.handle("audio-tags:save-tags", async (_event, payload) => {
    try {
      if (!payload || typeof payload.path !== "string") throw new Error("Missing audio file path.");
      const saved = await writeTags(payload.path, payload.tags);
      logEvent("INFO", "tags", `标签已保存：${payload.path}`);
      return saved;
    } catch (error) {
      logEvent("ERROR", "tags", `保存标签失败：${error.message}`);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  ipcMain.handle("audio-tags:import-image", () => importCoverImage());
  ipcMain.handle("audio-tags:export-image", (_event, payload) => {
    if (!payload || typeof payload.path !== "string") return { ok: false, error: "Missing audio file path." };
    return exportCoverImage(payload.path);
  });
}
