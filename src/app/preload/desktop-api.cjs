const { contextBridge, ipcRenderer } = require("electron");

/** Expose only the audio workspace operations to the renderer. */
function exposeDesktopApi() {
  contextBridge.exposeInMainWorld("videoTagApi", {
    openFolder: () => ipcRenderer.invoke("video-tags:open-folder"),
    saveTags: (path, tags) => ipcRenderer.invoke("video-tags:save", { path, tags }),
    importImage: () => ipcRenderer.invoke("video-tags:import-image"),
    exportImage: (path) => ipcRenderer.invoke("video-tags:export-image", { path }),
  });
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
    uploadConfigBackup: (webdav, backup) => ipcRenderer.invoke("settings:upload-config-backup", { webdav, backup }),
    downloadConfigBackup: (webdav) => ipcRenderer.invoke("settings:download-config-backup", webdav),
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
