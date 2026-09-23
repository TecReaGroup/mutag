import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { AUDIO_EXTENSIONS } from "./audio-formats.js";
import { normalizeTagKey, SUPPORTED_TAG_KEYS } from "../tag-rules.js";
import { logEvent } from "../../../shared/main/logging.js";

const require = createRequire(import.meta.url);
const { dialog } = require("electron");
const { File, TagTypes, Id3v2FrameClassType, ByteVector, Picture, PictureType } = require("node-taglib-sharp");

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

const IMAGE_TAG_KEY = "image";

const IMAGE_FILTERS = [
  { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] },
];

// Fields that are always present in the returned tags, even when empty.
const DEFAULT_TAG_KEYS = [IMAGE_TAG_KEY, "title", "artist", "album", "year", "genre", "bpm", "comment", "lyrics"];

const ALL_TAG_KEYS = [...SUPPORTED_TAG_KEYS];

function normalizeMimeType(mimeType) {
  const normalized = firstString(mimeType).trim().toLowerCase();
  return normalized.startsWith("image/") ? normalized : "image/jpeg";
}

function pictureToDataUrl(picture) {
  if (!picture?.data) return "";
  const mimeType = normalizeMimeType(picture.mimeType);
  const base64 = typeof picture.data.toBase64String === "function"
    ? picture.data.toBase64String()
    : Buffer.from(picture.data.toByteArray()).toString("base64");
  return base64 ? `data:${mimeType};base64,${base64}` : "";
}

function parseImageDataUrl(value) {
  const raw = normalizeTagValue(value).trim();
  if (!raw) return null;
  const match = raw.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  if (!match) throw new Error("Image must be a data URL.");
  return {
    mimeType: normalizeMimeType(match[1]),
    buffer: Buffer.from(match[2], "base64"),
  };
}

function readCoverImage(tag) {
  const pictures = Array.isArray(tag.pictures) ? tag.pictures : [];
  const frontCover = pictures.find((picture) => picture?.type === PictureType.FrontCover);
  return pictureToDataUrl(frontCover ?? pictures[0]);
}

function setCoverImage(tag, value) {
  const parsed = parseImageDataUrl(value);
  if (!parsed) {
    tag.pictures = [];
    return;
  }

  const picture = Picture.fromFullData(
    ByteVector.fromByteArray(parsed.buffer),
    PictureType.FrontCover,
    parsed.mimeType,
    "Cover"
  );
  const existing = Array.isArray(tag.pictures) ? tag.pictures : [];
  const withoutFrontCover = existing.filter((item, index) => item?.type !== PictureType.FrontCover && index !== 0);
  tag.pictures = [picture, ...withoutFrontCover];
}

function readTagValue(tag, key) {
  key = normalizeTagKey(key);
  if (key === IMAGE_TAG_KEY) return readCoverImage(tag);
  if (key in ARRAY_TAG_PROPS) return firstString(tag[ARRAY_TAG_PROPS[key]]);
  if (key in UINT_TAG_PROPS) {
    const value = tag[UINT_TAG_PROPS[key]];
    return value ? String(value) : "";
  }
  if (key in STRING_TAG_PROPS) return firstString(tag[STRING_TAG_PROPS[key]]);
  return "";
}

export function readTags(filePath) {
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
  key = normalizeTagKey(key);
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
    logEvent("WARN", "tags", `标题校验无法读取目录 ${dir}：${error.message}`);
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const siblingPath = path.join(dir, entry.name);
    if (path.resolve(siblingPath) === path.resolve(filePath)) continue;

    let siblingTitle;
    try {
      siblingTitle = readTags(siblingPath).title;
    } catch (error) {
      logEvent("WARN", "tags", `标题校验无法读取音频 ${siblingPath}：${error.message}`);
      continue;
    }
    if (normalizeTitleForCompare(siblingTitle) === title) {
      throw new Error(`Another audio file in this folder already has the title "${String(tags.title).trim()}"`);
    }
  }
}

/** Resolve the filename implied by a changed title and its track number. */
function resolveTitlePath(filePath, originalTags, savedTags) {
  const titleChanged = firstString(originalTags?.title).trim() !== firstString(savedTags?.title).trim();
  const title = sanitizeFileNamePart(savedTags?.title);
  if (!titleChanged || !title) return filePath;

  const track = parsePositiveInt(savedTags?.track_number);
  const prefix = track > 0 ? `${String(track).padStart(2, "0")} ` : "";
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const nextPath = path.join(dir, `${prefix}${title}${ext}`);

  return path.resolve(nextPath) === path.resolve(filePath) ? filePath : nextPath;
}

/** Reject an occupied rename destination without touching the audio file. */
async function validateRenameDestination(filePath, nextPath) {
  if (nextPath !== filePath && await pathExists(nextPath)) {
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

function writeTagValue(tag, key, value) {
  key = normalizeTagKey(key);
  if (key === IMAGE_TAG_KEY) setCoverImage(tag, value);
  else if (key in ARRAY_TAG_PROPS) setStringArray(tag, ARRAY_TAG_PROPS[key], value);
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

/** Save embedded LRC without applying title validation or renaming the track. */
export function writeLyrics(filePath, lyrics) {
  const file = File.createFromPath(filePath);
  try {
    repairId3v2TextFrames(file);
    file.tag.lyrics = lyrics;
    file.save();
  } finally {
    file.dispose();
  }
}

export async function writeTags(filePath, tags) {
  await validateTitleBeforeSave(filePath, tags);
  const originalTags = readTags(filePath);
  const changes = buildTagChanges(originalTags, tags);
  const savedTags = applyTagChanges(originalTags, changes);
  const nextPath = resolveTitlePath(filePath, originalTags, savedTags);
  await validateRenameDestination(filePath, nextPath);
  const file = File.createFromPath(filePath);
  try {
    repairId3v2TextFrames(file);
    const tag = file.tag;

    for (const { key, value } of changes) {
      writeTagValue(tag, key, value);
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

  if (nextPath !== filePath) {
    // Saving can take time; the destination may have appeared since validation.
    await validateRenameDestination(filePath, nextPath);
    await fs.rename(filePath, nextPath);
  }

  try {
    return { ok: true, tags: readTags(nextPath), path: nextPath, name: path.basename(nextPath) };
  } catch (error) {
    logEvent("WARN", "tags", `标签已保存但刷新失败 ${nextPath}：${error.message}`);
    return { ok: true, tags: savedTags, path: nextPath, name: path.basename(nextPath) };
  }
}

/** Select and read an image for a pending cover edit. */
export async function importCoverImage() {
  try {
    const selection = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: IMAGE_FILTERS,
    });
    if (selection.canceled || selection.filePaths.length === 0) return { ok: false, canceled: true };

    const imagePath = selection.filePaths[0];
    const buffer = await fs.readFile(imagePath);
    const mimeType = Picture.getMimeTypeFromFilename(imagePath);
    if (!mimeType.startsWith("image/")) throw new Error("Selected file is not a supported image.");
    return { ok: true, image: `data:${mimeType};base64,${buffer.toString("base64")}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Export an audio file's embedded cover using a save dialog. */
export async function exportCoverImage(filePath) {
  try {
    const image = readTags(filePath).image;
    if (!image) throw new Error("This audio file has no cover image.");
    const coverImage = parseImageDataUrl(image);
    const ext = Picture.getExtensionFromMimeType(coverImage.mimeType) ?? ".jpg";
    const audioName = sanitizeFileNamePart(path.basename(filePath, path.extname(filePath))) || "cover";
    const selection = await dialog.showSaveDialog({
      defaultPath: path.join(path.dirname(filePath), `${audioName}-cover${ext}`),
      filters: IMAGE_FILTERS,
    });
    if (selection.canceled || !selection.filePath) return { ok: false, canceled: true };

    await fs.writeFile(selection.filePath, coverImage.buffer);
    return { ok: true, path: selection.filePath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
