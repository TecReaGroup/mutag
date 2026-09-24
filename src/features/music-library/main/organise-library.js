import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { filenameFromTag } from "./library-paths.js";
import { saveProjectState } from "./project-state-storage.js";
import { logEvent } from "../../../shared/main/logging.js";
import { PROJECT_WORKSPACE_NAME } from "./project-workspace.js";

/** Remove empty descendants bottom-up without following directory links. */
async function removeEmptyDirectories(root, messages) {
  let removed = 0;
  async function visit(directory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (directory === root && entry.name === PROJECT_WORKSPACE_NAME) continue;
        if (entry.isDirectory() && !entry.isSymbolicLink()) await visit(path.join(directory, entry.name));
      }
      if (directory === root) return;
      // rmdir refuses nonempty directories, including files created during cleanup.
      await fs.rmdir(directory);
      removed += 1;
      logEvent("INFO", "music-library", `删除空文件夹 ${directory}`);
    } catch (error) {
      if (["ENOTEMPTY", "EEXIST", "ENOENT"].includes(error.code)) return;
      const warning = `空文件夹清理失败 ${directory}：${error.message}`;
      messages.push(warning);
      logEvent("WARN", "music-library", warning);
    }
  }
  await visit(root);
  return removed;
}

/** Organise scanned audio files and reconcile persisted paths. */
export async function organiseLibrary(root, files, projectState) {
  const realRoot = await fs.realpath(root);
  const moves = [];
  const messages = [];
  let unchanged = 0;
  let skipped = 0;
  logEvent("INFO", "music-library", `开始整理 ${root}，共 ${files.length} 个音频文件`);
  for (const audioFile of files) {
    try {
      const artistName = filenameFromTag(audioFile.savedTags.artist);
      const title = filenameFromTag(audioFile.savedTags.title);
      const directory = path.join(root, artistName);
      await fs.mkdir(directory, { recursive: true });
      const realDirectory = await fs.realpath(directory);
      const relativeDirectory = path.relative(realRoot, realDirectory);
      if (relativeDirectory.startsWith(`..${path.sep}`) || relativeDirectory === ".." || path.isAbsolute(relativeDirectory)) {
        throw new Error("歌手目录指向当前音乐目录之外");
      }
      const destination = path.join(directory, `${title}${path.extname(audioFile.path)}`);
      if (path.resolve(audioFile.path) !== destination) {
        // Exclusive copy also supports different volumes and never replaces an existing song.
        await fs.copyFile(audioFile.path, destination, constants.COPYFILE_EXCL);
        try {
          await fs.unlink(audioFile.path);
        } catch (error) {
          await fs.unlink(destination);
          throw error;
        }
        moves.push({ originalPath: audioFile.path, path: destination, name: path.basename(destination) });
        logEvent("INFO", "music-library", `移动 ${audioFile.path} -> ${destination}`);
      } else {
        unchanged += 1;
      }
    } catch (error) {
      skipped += 1;
      const reason = error.code === "EEXIST" ? "目标文件已存在" : error.message;
      messages.push(`跳过 ${audioFile.name}：${reason}`);
      logEvent("WARN", "music-library", messages[messages.length - 1]);
    }
  }
  if (projectState && moves.length) {
    const movesByPath = new Map(moves.map((move) => [move.originalPath, move.path]));
    const updatedState = {
      ...projectState,
      selectedId: movesByPath.get(projectState.selectedId) ?? projectState.selectedId,
      files: Object.fromEntries(Object.entries(projectState.files ?? {}).map(([filePath, savedState]) => [
        movesByPath.get(filePath) ?? filePath, savedState,
      ])),
    };
    try {
      await saveProjectState(root, updatedState);
    } catch (error) {
      messages.push(`文件已整理，但项目状态保存失败：${error.message}`);
    }
  }
  const removedDirectories = await removeEmptyDirectories(realRoot, messages);
  const summary = `整理完成：移动 ${moves.length} 个文件，${unchanged} 个已在正确位置，跳过 ${skipped} 个，清理 ${removedDirectories} 个空文件夹。`;
  for (const message of messages) logEvent("INFO", "music-library", message);
  logEvent("INFO", "music-library", summary);
  return { moves, messages: [summary, ...messages] };
}
