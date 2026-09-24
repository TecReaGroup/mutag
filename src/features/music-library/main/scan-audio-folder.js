import fs from "node:fs/promises";
import path from "node:path";
import { AUDIO_EXTENSIONS } from "../../audio-tags/main/audio-formats.js";
import { readTags } from "../../audio-tags/main/audio-tag-storage.js";
import { loadProjectState } from "./project-state-storage.js";
import { logEvent } from "../../../shared/main/logging.js";
import { PROJECT_WORKSPACE_NAME } from "./project-workspace.js";

const MAX_AUDIO_SCAN_DEPTH = 5;

async function walkAudioFiles(dir, depth = 1) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    logEvent("WARN", "scan", `无法读取目录 ${dir}：${error.message}`);
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth === 1 && entry.name === PROJECT_WORKSPACE_NAME) continue;
      if (depth < MAX_AUDIO_SCAN_DEPTH) files.push(...await walkAudioFiles(fullPath, depth + 1));
      continue;
    }
    if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

/** Scan supported audio files and restore their pending edits. */
export async function scanFolder(root) {
  logEvent("INFO", "scan", `开始扫描音乐目录：${root}`);
  const audioPaths = await walkAudioFiles(root);
  const projectState = await loadProjectState(root);
  const files = [];
  for (const filePath of audioPaths) {
    try {
      const persisted = projectState?.files?.[filePath];
      const savedTags = readTags(filePath);
      files.push({
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        savedTags,
        tempTags: persisted?.tempTags ? { ...savedTags, ...persisted.tempTags } : null,
        pendingArtwork: persisted?.pendingArtwork ?? null,
      });
    } catch (error) {
      logEvent("WARN", "scan", `无法读取音频 ${filePath}：${error.message}`);
    }
  }
  logEvent("INFO", "scan", `扫描完成：${root}，发现 ${audioPaths.length} 个音频，加载 ${files.length} 个`);
  return { root, files, projectState };
}
