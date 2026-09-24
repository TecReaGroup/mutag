import { createRequire } from "node:module";
import { downloadLibraryImages } from "./download-library-artwork.js";
import { generateLibraryImages } from "./generate-library-artwork.js";
import { prepareCoverUpdates } from "./library-artwork.js";
import { acceptArtwork, discardArtwork } from "./staged-artwork.js";
import { resolveProjectRoot } from "../../music-library/main/library-paths.js";
import { scanFolder } from "../../music-library/main/scan-audio-folder.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register artist and release artwork downloads. */
export function registerArtworkIpc() {
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
  ipcMain.handle("audio-tags:generate-images", async (_event, payload) => {
    const root = await resolveProjectRoot(payload);
    const folder = await scanFolder(root);
    const artwork = await generateLibraryImages(root, folder.files, payload.openAI);
    const covers = await prepareCoverUpdates(folder.files);
    return { proposals: artwork.proposals, updates: covers.updates, messages: [...artwork.messages, ...covers.messages] };
  });
}
