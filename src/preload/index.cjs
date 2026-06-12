const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("audioTagApi", {
  openFolder: () => ipcRenderer.invoke("audio-tags:open-folder"),
  openLastFolder: (root) => ipcRenderer.invoke("audio-tags:open-last-folder", root),
  loadConfig: () => ipcRenderer.invoke("audio-tags:load-config"),
  saveConfig: (config) => ipcRenderer.invoke("audio-tags:save-config", config),
  saveProjectState: (root, state) =>
    ipcRenderer.invoke("audio-tags:save-project-state", { root, state }),
  saveTags: (path, tags) =>
    ipcRenderer.invoke("audio-tags:save-tags", { path, tags }),
});
