const { contextBridge, ipcRenderer } = require("electron");

/** Expose only the audio workspace operations to the renderer. */
function exposeAudioTagApi() {
  contextBridge.exposeInMainWorld("audioTagApi", {
    openFolder: () => ipcRenderer.invoke("audio-tags:open-folder"),
    openLastFolder: (root) => ipcRenderer.invoke("audio-tags:open-last-folder", root),
    organise: (root) => ipcRenderer.invoke("audio-tags:organise", { root }),
    downloadImages: (root, openAI) => ipcRenderer.invoke("audio-tags:download-images", { root, openAI }),
    loadConfig: () => ipcRenderer.invoke("audio-tags:load-config"),
    saveConfig: (config) => ipcRenderer.invoke("audio-tags:save-config", config),
    saveProjectState: (root, state) =>
      ipcRenderer.invoke("audio-tags:save-project-state", { root, state }),
    saveTags: (path, tags) =>
      ipcRenderer.invoke("audio-tags:save-tags", { path, tags }),
    importImage: () => ipcRenderer.invoke("audio-tags:import-image"),
    exportImage: (path) => ipcRenderer.invoke("audio-tags:export-image", { path }),
  });
}

module.exports = { exposeAudioTagApi };
