const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("audioTagApi", {
  openFolder: () => ipcRenderer.invoke("audio-tags:open-folder"),
  saveTags: (path, tags, deleted) =>
    ipcRenderer.invoke("audio-tags:save-tags", { path, tags, deleted }),
});
