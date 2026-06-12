import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { File, TagTypes, Id3v2FrameClassType } = require("node-taglib-sharp");

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
const MAX_AUDIO_SCAN_DEPTH = 5;
const CONFIG_PATH = path.join(os.tmpdir(), "mutag_config.json");

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

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

async function walkAudioFiles(dir, depth = 1) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.warn(`Skipping unreadable directory: ${dir}`, error);
    return [];
  }

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth < MAX_AUDIO_SCAN_DEPTH) {
        files.push(...await walkAudioFiles(fullPath, depth + 1));
      }
      continue;
    }
    if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn(`Failed to read JSON file: ${filePath}`, error);
    return fallback;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function projectStatePath(root) {
  return path.join(root, "mutag.json");
}

async function scanFolder(root) {
  const audioPaths = await walkAudioFiles(root);
  const projectState = await readJsonFile(projectStatePath(root), null);
  const files = [];

  for (const filePath of audioPaths) {
    try {
      const persisted = projectState?.files?.[filePath];
      files.push({
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        savedTags: readTags(filePath),
        tempTags: persisted?.tempTags ?? null,
      });
    } catch (error) {
      console.warn(`Skipping unreadable audio file: ${filePath}`, error);
    }
  }

  return { root, files, projectState };
}

function firstString(value) {
  if (Array.isArray(value)) return value[0] == null ? "" : String(value[0]);
  return value == null ? "" : String(value);
}

// Maps from our tag keys to node-taglib-sharp Tag properties, grouped by value shape.
const ARRAY_TAG_PROPS = {
  artist: "performers",
  genre: "genres",
  album_artist: "albumArtists",
  composer: "composers",
};

const UINT_TAG_PROPS = {
  year: "year",
  bpm: "beatsPerMinute",
  track_number: "track",
  track_total: "trackCount",
  disc_number: "disc",
  disc_total: "discCount",
};

const STRING_TAG_PROPS = {
  title: "title",
  album: "album",
  comment: "comment",
  lyrics: "lyrics",
  subtitle: "subtitle",
  description: "description",
  grouping: "grouping",
  copyright: "copyright",
  conductor: "conductor",
  remixedby: "remixedBy",
  publisher: "publisher",
  isrc: "isrc",
  initial_key: "initialKey",
  musicbrainz_artist_id: "musicBrainzArtistId",
  musicbrainz_album_id: "musicBrainzReleaseId",
  musicbrainz_albumartist_id: "musicBrainzReleaseArtistId",
  musicbrainz_track_id: "musicBrainzTrackId",
  musicbrainz_release_group_id: "musicBrainzReleaseGroupId",
  musicbrainz_disc_id: "musicBrainzDiscId",
  musicbrainz_release_status: "musicBrainzReleaseStatus",
  musicbrainz_release_type: "musicBrainzReleaseType",
  musicbrainz_release_country: "musicBrainzReleaseCountry",
  musicip_id: "musicIpId",
  amazon_id: "amazonId",
};

const TAG_KEY_ALIASES = {
  albumartist: "album_artist",
  track: "track_number",
  tracktotal: "track_total",
  disc: "disc_number",
  disctotal: "disc_total",
  initialkey: "initial_key",
  musicbrainzalbumid: "musicbrainz_album_id",
  musicbrainzalbumartistid: "musicbrainz_albumartist_id",
  musicbrainzartistid: "musicbrainz_artist_id",
  musicbrainztrackid: "musicbrainz_track_id",
};

// Fields that are always present in the returned tags, even when empty.
const DEFAULT_TAG_KEYS = ["title", "artist", "album", "year", "genre", "bpm", "comment", "lyrics"];

const ALL_TAG_KEYS = [
  ...Object.keys(ARRAY_TAG_PROPS),
  ...Object.keys(UINT_TAG_PROPS),
  ...Object.keys(STRING_TAG_PROPS),
];

function readTagValue(tag, key) {
  key = TAG_KEY_ALIASES[key] ?? key;
  if (key in ARRAY_TAG_PROPS) return firstString(tag[ARRAY_TAG_PROPS[key]]);
  if (key in UINT_TAG_PROPS) {
    const value = tag[UINT_TAG_PROPS[key]];
    return value ? String(value) : "";
  }
  if (key in STRING_TAG_PROPS) return firstString(tag[STRING_TAG_PROPS[key]]);
  return "";
}

function readTags(filePath) {
  const file = File.createFromPath(filePath);
  try {
    const tag = file.tag;
    const tags = {};

    // Default fields are always present, even when empty.
    for (const key of DEFAULT_TAG_KEYS) tags[key] = readTagValue(tag, key);

    // Any other supported tag is included only when the file actually has a value.
    for (const key of ALL_TAG_KEYS) {
      if (key in tags) continue;
      const value = readTagValue(tag, key);
      if (value !== "") tags[key] = value;
    }

    return tags;
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

function sanitizeFileNamePart(value) {
  return String(value ?? "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeTitleForCompare(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getSavedTagValue(tags, key) {
  key = TAG_KEY_ALIASES[key] ?? key;
  return tags?.[key] == null ? "" : String(tags[key]);
}

function normalizeTagValue(value) {
  return value == null ? "" : String(value);
}

function buildTagChanges(originalTags, nextTags) {
  const next = nextTags && typeof nextTags === "object" ? nextTags : {};
  const changes = [];

  for (const key of ALL_TAG_KEYS) {
    const originalValue = getSavedTagValue(originalTags, key);
    const nextValue = normalizeTagValue(next[key] ?? originalValue);

    if (nextValue !== originalValue) {
      changes.push({ key, value: nextValue });
    }
  }

  return changes;
}

function applyTagChanges(originalTags, changes) {
  const savedTags = { ...originalTags };
  for (const { key, value } of changes) savedTags[key] = value;
  return savedTags;
}

async function validateTitleBeforeSave(filePath, tags) {
  const title = normalizeTitleForCompare(tags?.title);
  if (!title) {
    throw new Error("Title cannot be empty");
  }

  const dir = path.dirname(filePath);
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.warn(`Failed to read directory for title validation: ${dir}`, error);
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const siblingPath = path.join(dir, entry.name);
    if (path.resolve(siblingPath) === path.resolve(filePath)) continue;

    try {
      if (normalizeTitleForCompare(readTags(siblingPath).title) === title) {
        throw new Error(`Another audio file in this folder already has the title "${String(tags.title).trim()}"`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Another audio file")) throw error;
      console.warn(`Skipping unreadable audio file during title validation: ${siblingPath}`, error);
    }
  }
}

async function renameFileForTitle(filePath, originalTags, savedTags) {
  const titleChanged = firstString(originalTags?.title).trim() !== firstString(savedTags?.title).trim();
  const title = sanitizeFileNamePart(savedTags?.title);
  if (!titleChanged || !title) return filePath;

  const track = parsePositiveInt(savedTags?.track_number);
  const prefix = track > 0 ? `${String(track).padStart(2, "0")} ` : "";
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const nextPath = path.join(dir, `${prefix}${title}${ext}`);

  if (path.resolve(nextPath) === path.resolve(filePath)) return filePath;
  if (await pathExists(nextPath)) {
    throw new Error(`A file named "${path.basename(nextPath)}" already exists in this folder`);
  }
  await fs.rename(filePath, nextPath);
  return nextPath;
}

async function validateRenameBeforeSave(filePath, originalTags, nextTags) {
  const titleChanged = firstString(originalTags?.title).trim() !== firstString(nextTags?.title).trim();
  const title = sanitizeFileNamePart(nextTags?.title);
  if (!titleChanged || !title) return;

  const track = parsePositiveInt(nextTags?.track_number);
  const prefix = track > 0 ? `${String(track).padStart(2, "0")} ` : "";
  const nextPath = path.join(path.dirname(filePath), `${prefix}${title}${path.extname(filePath)}`);
  if (path.resolve(nextPath) !== path.resolve(filePath) && await pathExists(nextPath)) {
    throw new Error(`A file named "${path.basename(nextPath)}" already exists in this folder`);
  }
}

function setString(tag, key, value) {
  tag[key] = normalizeTagValue(value);
}

function setStringArray(tag, key, value) {
  const normalized = normalizeTagValue(value).trim();
  tag[key] = normalized ? [normalized] : [];
}

function clearTagValue(tag, key) {
  key = TAG_KEY_ALIASES[key] ?? key;
  if (key in ARRAY_TAG_PROPS) setStringArray(tag, ARRAY_TAG_PROPS[key], "");
  else if (key in UINT_TAG_PROPS) tag[UINT_TAG_PROPS[key]] = 0;
  else if (key in STRING_TAG_PROPS) setString(tag, STRING_TAG_PROPS[key], "");
}

function writeTagValue(tag, key, value) {
  key = TAG_KEY_ALIASES[key] ?? key;
  if (key in ARRAY_TAG_PROPS) setStringArray(tag, ARRAY_TAG_PROPS[key], value);
  else if (key in UINT_TAG_PROPS) tag[UINT_TAG_PROPS[key]] = parsePositiveInt(value);
  else if (key in STRING_TAG_PROPS) setString(tag, STRING_TAG_PROPS[key], value);
}

function writeSnapshotToTag(tag, snapshot) {
  for (const key of ALL_TAG_KEYS) {
    const value = normalizeTagValue(snapshot[key]);
    if (value !== "") writeTagValue(tag, key, value);
  }
}

function repairId3v2TextFrames(file) {
  if (!TagTypes || !Id3v2FrameClassType || typeof file.getTag !== "function") return;

  const tag = file.getTag(TagTypes.Id3v2, false);
  if (!tag || typeof tag.getFramesByClassType !== "function") return;

  const textArrayFrameTypes = [
    Id3v2FrameClassType.TextInformationFrame,
    Id3v2FrameClassType.UserTextInformationFrame,
    Id3v2FrameClassType.UrlLinkFrame,
    Id3v2FrameClassType.UserUrlLinkFrame,
  ];
  for (const type of textArrayFrameTypes) {
    const frames = tag.getFramesByClassType(type) ?? [];
    for (const frame of frames) {
      try {
        const textFields = frame.text;
        if (!Array.isArray(textFields)) continue;
        const repaired = textFields.map((text) => normalizeTagValue(text));
        if (repaired.some((text, idx) => text !== textFields[idx])) frame.text = repaired;
      } catch {
        // Ignore malformed optional frames; saving should be driven by supported tag fields.
      }
    }
  }

  const scalarTextFrameTypes = [
    Id3v2FrameClassType.CommentsFrame,
    Id3v2FrameClassType.UnsynchronizedLyricsFrame,
    Id3v2FrameClassType.TermsOfUseFrame,
  ];
  for (const type of scalarTextFrameTypes) {
    const frames = tag.getFramesByClassType(type) ?? [];
    for (const frame of frames) {
      try {
        frame.text = normalizeTagValue(frame.text);
        if ("description" in frame) frame.description = normalizeTagValue(frame.description);
        if ("language" in frame) {
          const language = normalizeTagValue(frame.language);
          frame.language = language.length >= 3 ? language.slice(0, 3) : "XXX";
        }
      } catch {
        // Ignore malformed optional frames; saving should be driven by supported tag fields.
      }
    }
  }
}

async function writeTags(filePath, tags) {
  await validateTitleBeforeSave(filePath, tags);
  const originalTags = readTags(filePath);
  const changes = buildTagChanges(originalTags, tags);
  const savedTags = applyTagChanges(originalTags, changes);
  await validateRenameBeforeSave(filePath, originalTags, savedTags);
  const file = File.createFromPath(filePath);
  try {
    repairId3v2TextFrames(file);
    const tag = file.tag;

    for (const { key, value } of changes) {
      if (value === "") clearTagValue(tag, key);
      else writeTagValue(tag, key, value);
    }

    try {
      file.save();
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("text was not provided")) throw error;

      file.removeTags(file.tagTypes);
      let cleanTag;
      try {
        cleanTag = file.getTag(TagTypes.Id3v2, true);
      } catch {
        cleanTag = file.tag;
      }
      writeSnapshotToTag(cleanTag, savedTags);
      file.save();
    }
  } finally {
    file.dispose();
  }

  const nextPath = await renameFileForTitle(filePath, originalTags, savedTags);

  try {
    return { ok: true, tags: readTags(nextPath), path: nextPath, name: path.basename(nextPath) };
  } catch (error) {
    console.warn(`Saved tags but failed to refresh metadata: ${nextPath}`, error);
    return { ok: true, tags: savedTags, path: nextPath, name: path.basename(nextPath) };
  }
}

ipcMain.handle("audio-tags:open-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const root = result.filePaths[0];
  return scanFolder(root);
});

ipcMain.handle("audio-tags:open-last-folder", async (_event, root) => {
  if (!root || typeof root !== "string") return null;
  try {
    return await scanFolder(root);
  } catch (error) {
    console.warn(`Failed to reopen last folder: ${root}`, error);
    return null;
  }
});

ipcMain.handle("audio-tags:load-config", async () => {
  return readJsonFile(CONFIG_PATH, null);
});

ipcMain.handle("audio-tags:save-config", async (_event, config) => {
  await writeJsonFile(CONFIG_PATH, config ?? {});
  return { ok: true };
});

ipcMain.handle("audio-tags:save-project-state", async (_event, payload) => {
  if (!payload || typeof payload.root !== "string") {
    throw new Error("Missing project root.");
  }
  await writeJsonFile(projectStatePath(payload.root), payload.state ?? {});
  return { ok: true };
});

ipcMain.handle("audio-tags:save-tags", async (_event, payload) => {
  try {
    if (!payload || typeof payload.path !== "string") {
      throw new Error("Missing audio file path.");
    }
    return await writeTags(payload.path, payload.tags);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
