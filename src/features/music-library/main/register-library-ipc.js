import { createRequire } from "node:module";
import { scanFolder } from "./scan-audio-folder.js";
import { organiseLibrary } from "./organise-library.js";
import { saveProjectState } from "./project-state-storage.js";
import { resolveProjectRoot } from "./library-paths.js";
import { logEvent } from "../../../shared/main/logging.js";

const { dialog, ipcMain } = createRequire(import.meta.url)("electron");

/** Register library browsing, organisation, and project persistence. */
export function registerLibraryIpc() {
  ipcMain.handle("audio-tags:open-folder", async () => {
    const selection = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (selection.canceled || !selection.filePaths.length) return null;
    return scanFolder(selection.filePaths[0]);
  });
  ipcMain.handle("audio-tags:open-last-folder", async (_event, root) => {
    if (!root || typeof root !== "string") return null;
    try { return await scanFolder(root); }
    catch (error) { logEvent("ERROR", "scan", `恢复目录失败 ${root}：${error.message}`); return null; }
  });
  ipcMain.handle("audio-tags:organise", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    const folder = await scanFolder(root);
    return organiseLibrary(root, folder.files, folder.projectState);
  });
  ipcMain.handle("audio-tags:save-project-state", async (_event, payload) => {
    if (!payload || typeof payload.root !== "string" || !payload.root.trim()) throw new Error("Missing project root.");
    await saveProjectState(payload.root, payload.state ?? {});
    return { ok: true };
  });
}
