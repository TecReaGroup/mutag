import { createRequire } from "node:module";
import { downloadLibraryImages } from "./download-library-artwork.js";
import { resolveProjectRoot } from "../../music-library/main/library-paths.js";
import { scanFolder } from "../../music-library/main/scan-audio-folder.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register artist and release artwork downloads. */
export function registerArtworkIpc() {
  ipcMain.handle("audio-tags:download-images", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    const folder = await scanFolder(root);
    return downloadLibraryImages(root, folder.files, payload.openAI);
  });
}
