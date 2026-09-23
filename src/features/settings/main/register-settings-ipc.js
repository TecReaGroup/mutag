import { createRequire } from "node:module";
import { loadConfiguration, saveConfiguration } from "./configuration-storage.js";

const { ipcMain } = createRequire(import.meta.url)("electron");

/** Register application settings persistence. */
export function registerSettingsIpc() {
  ipcMain.handle("audio-tags:load-config", () => loadConfiguration());
  ipcMain.handle("audio-tags:save-config", (_event, config) => saveConfiguration(config));
}
