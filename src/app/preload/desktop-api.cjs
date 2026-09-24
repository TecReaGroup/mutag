const { contextBridge, ipcRenderer } = require("electron");

/** Expose only the audio workspace operations to the renderer. */
function exposeDesktopApi() {
  contextBridge.exposeInMainWorld("audioTagApi", {
    logEvent: (level, module, message) => ipcRenderer.send("app:log-event", { level, module, message }),
    openFolder: () => ipcRenderer.invoke("audio-tags:open-folder"),
    openLastFolder: (root) => ipcRenderer.invoke("audio-tags:open-last-folder", root),
    organise: (root) => ipcRenderer.invoke("audio-tags:organise", { root }),
    downloadImages: (root, openAI) => ipcRenderer.invoke("audio-tags:download-images", { root, openAI }),
    generateImages: (root, openAI, requestId) => ipcRenderer.invoke("audio-tags:generate-images", { root, openAI, requestId }),
    cancelImageGeneration: (requestId) => ipcRenderer.send("audio-tags:cancel-image-generation", requestId),
    generateLyrics: (root, openAI, paths) => ipcRenderer.invoke("audio-tags:generate-lyrics", { root, openAI, paths }),
    loadConfig: () => ipcRenderer.invoke("audio-tags:load-config"),
    saveConfig: (config) => ipcRenderer.invoke("audio-tags:save-config", config),
    saveProjectState: (root, state) =>
      ipcRenderer.invoke("audio-tags:save-project-state", { root, state }),
    saveTags: (path, tags) =>
      ipcRenderer.invoke("audio-tags:save-tags", { path, tags }),
    acceptArtwork: (path, tags, token) => ipcRenderer.invoke("audio-tags:accept-artwork", { path, tags, token }),
    discardArtwork: (path, token) => ipcRenderer.invoke("audio-tags:discard-artwork", { path, token }),
    importImage: () => ipcRenderer.invoke("audio-tags:import-image"),
    exportImage: (path) => ipcRenderer.invoke("audio-tags:export-image", { path }),
  });
}

module.exports = { exposeDesktopApi };
