import { createRequire } from "node:module";
import { loadConfiguration, saveConfiguration } from "./configuration-storage.js";
import { downloadConfigBackup, uploadConfigBackup } from "./webdav-backup.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register application settings persistence. */
export function registerSettingsIpc() {
  ipcMain.handle("audio-tags:load-config", () => loadConfiguration());
  ipcMain.handle("audio-tags:save-config", (_event, config) => saveConfiguration(config));
  ipcMain.handle("settings:upload-config-backup", (_event, { webdav, backup }) => uploadConfigBackup(webdav, backup));
  ipcMain.handle("settings:download-config-backup", (_event, webdav) => downloadConfigBackup(webdav));
}
