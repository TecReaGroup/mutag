import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { File } = require("node-taglib-sharp");

app.name = "mutag";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".flac",
  ".wav",
  ".aif",
  ".aiff",
  ".m4a",
  ".ogg",
  ".opus",
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: "mutag",
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

async function walkAudioFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkAudioFiles(fullPath));
      continue;
    }
    if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function firstString(value) {
  if (Array.isArray(value)) return value[0] == null ? "" : String(value[0]);
  return value == null ? "" : String(value);
}

function readTags(filePath) {
  const file = File.createFromPath(filePath);
  try {
    const tag = file.tag;
    return {
      title: firstString(tag.title),
      artist: firstString(tag.performers),
      album: firstString(tag.album),
      year: tag.year ? String(tag.year) : "",
      genre: firstString(tag.genres),
      bpm: tag.beatsPerMinute ? String(tag.beatsPerMinute) : "",
      comment: firstString(tag.comment),
      lyrics: firstString(tag.lyrics),
    };
  } finally {
    file.dispose();
  }
}

function parsePositiveInt(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return 0;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function setString(tag, key, value) {
  tag[key] = String(value ?? "");
}

function setStringArray(tag, key, value) {
  const normalized = String(value ?? "").trim();
  tag[key] = normalized ? [normalized] : [];
}

function writeTags(filePath, tags, deleted) {
  const file = File.createFromPath(filePath);
  try {
    const tag = file.tag;
    const deletedSet = new Set(Array.isArray(deleted) ? deleted : []);
    const next = tags && typeof tags === "object" ? tags : {};

    if (deletedSet.has("title")) setString(tag, "title", "");
    else if ("title" in next) setString(tag, "title", next.title);

    if (deletedSet.has("artist")) setStringArray(tag, "performers", "");
    else if ("artist" in next) setStringArray(tag, "performers", next.artist);

    if (deletedSet.has("album")) setString(tag, "album", "");
    else if ("album" in next) setString(tag, "album", next.album);

    if (deletedSet.has("year")) tag.year = 0;
    else if ("year" in next) tag.year = parsePositiveInt(next.year);

    if (deletedSet.has("genre")) setStringArray(tag, "genres", "");
    else if ("genre" in next) setStringArray(tag, "genres", next.genre);

    if (deletedSet.has("bpm")) tag.beatsPerMinute = 0;
    else if ("bpm" in next) tag.beatsPerMinute = parsePositiveInt(next.bpm);

    if (deletedSet.has("comment")) setString(tag, "comment", "");
    else if ("comment" in next) setString(tag, "comment", next.comment);

    if (deletedSet.has("lyrics")) setString(tag, "lyrics", "");
    else if ("lyrics" in next) setString(tag, "lyrics", next.lyrics);

    file.save();
    return { ok: true };
  } finally {
    file.dispose();
  }
}

ipcMain.handle("audio-tags:open-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  const root = result.filePaths[0];
  const audioPaths = await walkAudioFiles(root);
  const files = [];

  for (const filePath of audioPaths) {
    try {
      files.push({
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        savedTags: readTags(filePath),
        tempTags: null,
        tempDeleted: [],
      });
    } catch (error) {
      console.warn(`Skipping unreadable audio file: ${filePath}`, error);
    }
  }

  return files;
});

ipcMain.handle("audio-tags:save-tags", async (_event, payload) => {
  if (!payload || typeof payload.path !== "string") {
    throw new Error("Missing audio file path.");
  }
  return writeTags(payload.path, payload.tags, payload.deleted);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
