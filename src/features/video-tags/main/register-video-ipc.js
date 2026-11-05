import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { logEvent } from "../../../shared/main/logging.js";

const require = createRequire(import.meta.url);
const { ipcMain, dialog } = require("electron");
const { File, ByteVector, Picture, PictureType } = require("node-taglib-sharp");
const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".wmv", ".asf", ".avi", ".divx"]);
const MAX_SCAN_DEPTH = 5;
const TAG_KEYS = ["title", "creator", "album", "image"];
const openedPaths = new Set();

/** Read the four video fields without applying audio conventions. */
function readVideoTags(filePath) {
  const video = File.createFromPath(filePath);
  try {
    const tag = video.tag;
    const cover = tag.pictures.find((picture) => picture.type === PictureType.FrontCover) ?? tag.pictures[0];
    return { title: tag.title ?? "", creator: (tag.performers ?? []).join("; "), album: tag.album ?? "", image: cover ? `data:${cover.mimeType};base64,${cover.data.toBase64String()}` : "" };
  } finally { video.dispose(); }
}

/** Collect editable videos and report unreadable files to the workspace. */
async function scanVideos(directory, files, warnings, depth = 1) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    try {
      if (entry.isDirectory() && depth < MAX_SCAN_DEPTH) await scanVideos(filePath, files, warnings, depth + 1);
      else if (entry.isFile() && VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const savedTags = readVideoTags(filePath);
        files.push({ path: filePath, name: entry.name, savedTags, draft: { ...savedTags } });
      }
    } catch (error) {
      warnings.push(`${entry.name}: ${error.message}`);
      logEvent("WARN", "video-tags", `Cannot read ${filePath}: ${error.message}`);
    }
  }
}

/** Register video-only dialogs and metadata operations. */
export function registerVideoIpc() {
  ipcMain.handle("video-tags:open-folder", async () => {
    try {
      const selection = await dialog.showOpenDialog({ properties: ["openDirectory"] });
      if (selection.canceled) return { ok: false, canceled: true };
      const root = selection.filePaths[0];
      const files = [];
      const warnings = [];
      await scanVideos(root, files, warnings);
      files.sort((left, right) => left.path.localeCompare(right.path));
      openedPaths.clear();
      for (const video of files) openedPaths.add(video.path);
      logEvent("INFO", "video-tags", `Opened ${root}: ${files.length} videos`);
      return { ok: true, root, files, warnings };
    } catch (error) {
      logEvent("ERROR", "video-tags", `Open failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
  });
  ipcMain.handle("video-tags:save", async (_event, payload) => {
    try {
      if (!payload || !openedPaths.has(payload.path) || !payload.tags || TAG_KEYS.some((key) => typeof payload.tags[key] !== "string") || Object.keys(payload.tags).some((key) => !TAG_KEYS.includes(key))) throw new Error("Invalid video tag request.");
      const { tags, path: filePath } = payload;
      const original = readVideoTags(filePath);
      let picture;
      if (tags.image && tags.image !== original.image) {
        const match = tags.image.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) throw new Error("Cover must be a JPEG or PNG image.");
        picture = Picture.fromFullData(ByteVector.fromByteArray(Buffer.from(match[2], "base64")), PictureType.FrontCover, match[1], "Cover");
      }
      const video = File.createFromPath(filePath);
      try {
        if (tags.title !== original.title) video.tag.title = tags.title;
        // Creator uses the container's native author/artist mapping.
        if (tags.creator !== original.creator) video.tag.performers = tags.creator.split(";").map((creator) => creator.trim()).filter(Boolean);
        if (tags.album !== original.album) video.tag.album = tags.album;
        if (tags.image !== original.image) {
          const pictures = video.tag.pictures;
          const coverIndex = pictures.findIndex((cover) => cover.type === PictureType.FrontCover);
          const retained = pictures.filter((_cover, index) => index !== (coverIndex < 0 ? 0 : coverIndex));
          video.tag.pictures = picture ? [picture, ...retained] : [];
        }
        video.save();
      } finally { video.dispose(); }
      const savedTags = readVideoTags(filePath);
      logEvent("INFO", "video-tags", `Saved ${filePath}`);
      return { ok: true, tags: savedTags };
    } catch (error) {
      logEvent("ERROR", "video-tags", `Save failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
  });
  ipcMain.handle("video-tags:import-image", async () => {
    try {
      const selection = await dialog.showOpenDialog({ properties: ["openFile"], filters: [{ name: "JPEG / PNG", extensions: ["jpg", "jpeg", "png"] }] });
      if (selection.canceled) return { ok: false, canceled: true };
      const bytes = await fs.readFile(selection.filePaths[0]);
      const mime = Picture.getMimeTypeFromFilename(selection.filePaths[0]);
      if (!["image/jpeg", "image/png"].includes(mime)) throw new Error("Cover must be a JPEG or PNG image.");
      return { ok: true, image: `data:${mime};base64,${bytes.toString("base64")}` };
    } catch (error) {
      logEvent("ERROR", "video-tags", `Image import failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
  });
  ipcMain.handle("video-tags:export-image", async (_event, payload) => {
    try {
      if (!payload || !openedPaths.has(payload.path)) throw new Error("Invalid video file path.");
      const image = readVideoTags(payload.path).image;
      const match = image.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) throw new Error("This video has no supported cover image.");
      const extension = Picture.getExtensionFromMimeType(match[1]) ?? ".jpg";
      const name = path.basename(payload.path, path.extname(payload.path));
      const selection = await dialog.showSaveDialog({
        defaultPath: path.join(path.dirname(payload.path), `${name}-cover${extension}`),
        filters: [{ name: "Cover image", extensions: [extension.replace(/^\./, "")] }],
      });
      if (selection.canceled || !selection.filePath) return { ok: false, canceled: true };
      await fs.writeFile(selection.filePath, Buffer.from(match[2], "base64"));
      logEvent("INFO", "video-tags", `Exported cover to ${selection.filePath}`);
      return { ok: true, path: selection.filePath };
    } catch (error) {
      logEvent("ERROR", "video-tags", `Image export failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
  });
}
