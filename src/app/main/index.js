import path from "node:path";
import { createRequire } from "node:module";
import { registerAudioTagIpc } from "../../features/audio-tags/main/register-audio-tag-ipc.js";
import { registerLibraryIpc } from "../../features/music-library/main/register-library-ipc.js";
import { registerSettingsIpc } from "../../features/settings/main/register-settings-ipc.js";
import { registerArtworkIpc } from "../../features/artwork/main/register-artwork-ipc.js";
import { logEvent } from "../../shared/main/logging.js";

const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require("electron");

app.name = "mutag";
logEvent("INFO", "app", `启动 mutag，PID=${process.pid}，工作目录=${process.cwd()}`);
process.on("uncaughtExceptionMonitor", (error) => logEvent("ERROR", "app", error.stack ?? error.message));

function getAppIconPath() {
  if (app.isPackaged) return undefined;
  return path.join(__dirname, "..", "..", "assets", "icon", "icon.png");
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: "mutag",
    icon: getAppIconPath(),
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.on("did-finish-load", () => logEvent("INFO", "window", "界面加载完成"));
  mainWindow.webContents.on("did-fail-load", (_event, code, description) => logEvent("ERROR", "window", `界面加载失败 ${code}：${description}`));
  mainWindow.webContents.on("render-process-gone", (_event, details) => logEvent("ERROR", "window", `渲染进程退出：${details.reason}，退出码=${details.exitCode}`));

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

registerAudioTagIpc();
registerLibraryIpc();
registerSettingsIpc();
registerArtworkIpc();

app.whenReady().then(() => {
  logEvent("INFO", "app", `Electron 已就绪，版本=${process.versions.electron}`);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => logEvent("INFO", "app", "应用退出"));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
