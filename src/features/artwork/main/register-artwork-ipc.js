import { createRequire } from "node:module";
import { downloadLibraryImages } from "./download-library-artwork.js";
import { generateLibraryImages } from "./generate-library-artwork.js";
import { prepareCoverUpdates } from "./library-artwork.js";
import { acceptArtwork, discardArtwork } from "./staged-artwork.js";
import { resolveProjectRoot } from "../../music-library/main/library-paths.js";
import { scanFolder } from "../../music-library/main/scan-audio-folder.js";
import { logEvent } from "../../../shared/main/logging.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register artist and release artwork downloads. */
export function registerArtworkIpc() {
  const generations = new Map();
  ipcMain.on("audio-tags:cancel-image-generation", (event, requestId) => {
    generations.get(`${event.sender.id}:${requestId}`)?.abort();
  });
  ipcMain.handle("audio-tags:accept-artwork", async (_event, payload) => {
    try { return await acceptArtwork(payload.path, payload.tags, payload.token); }
    catch (error) { return { ok: false, error: error.message }; }
  });
  ipcMain.handle("audio-tags:discard-artwork", (_event, payload) => discardArtwork(payload.path, payload.token));
  ipcMain.handle("audio-tags:download-images", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    const folder = await scanFolder(root);
    const artwork = await downloadLibraryImages(root, folder.files, payload.openAI);
    const covers = await prepareCoverUpdates(folder.files);
    return { updates: covers.updates, messages: [...artwork.messages, ...covers.messages] };
  });
  ipcMain.handle("audio-tags:generate-images", async (event, payload) => {
    if (typeof payload.requestId !== "string" || !payload.requestId) throw new Error("图片生成请求标识无效。");
    const key = `${event.sender.id}:${payload.requestId}`;
    const controller = new AbortController();
    generations.set(key, controller);
    const cancel = () => controller.abort();
    event.sender.once("destroyed", cancel);
    try {
      const root = await resolveProjectRoot(payload);
      controller.signal.throwIfAborted();
      const folder = await scanFolder(root);
      controller.signal.throwIfAborted();
      const artwork = await generateLibraryImages(root, folder.files, payload.openAI, controller.signal);
      controller.signal.throwIfAborted();
      const covers = await prepareCoverUpdates(folder.files);
      controller.signal.throwIfAborted();
      return { proposals: artwork.proposals, updates: covers.updates, messages: [...artwork.messages, ...covers.messages] };
    } catch (error) {
      if (controller.signal.aborted) logEvent("INFO", "artwork", "图片生成已取消：中断当前请求，停止后续歌手任务。");
      throw error;
    } finally {
      generations.delete(key);
      event.sender.removeListener("destroyed", cancel);
    }
  });
}
