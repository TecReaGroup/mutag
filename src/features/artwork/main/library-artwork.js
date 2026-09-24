import fs from "node:fs/promises";
import path from "node:path";
import { filenameFromTag } from "../../music-library/main/library-paths.js";

/** Validate the whole library before starting any artwork requests or writes. */
export async function collectArtistDirectories(root, files) {
  const realRoot = await fs.realpath(root);
  const artists = new Map();
  for (const file of files) {
    const directory = path.resolve(root, filenameFromTag(file.savedTags.artist));
    if (path.relative(directory, path.dirname(path.resolve(file.path))) !== "") {
      throw new Error(`${file.name} 尚未按 artist 整理，操作已终止，请先执行 /organise。`);
    }
    if (!artists.has(directory)) {
      const relative = path.relative(realRoot, await fs.realpath(directory));
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("歌手目录指向音乐目录之外，操作已终止。");
      artists.set(directory, { artist: file.savedTags.artist, songs: [] });
    }
    artists.get(directory).songs.push({ title: file.savedTags.title, album: file.savedTags.album });
  }
  return artists;
}

/** Stage missing embedded covers for the existing Accept workflow. */
export async function prepareCoverUpdates(files) {
  const covers = new Map();
  const updates = [];
  const messages = [];
  for (const file of files) {
    if (file.savedTags.image) continue;
    const coverPath = path.join(path.dirname(file.path), "cover.jpg");
    if (!covers.has(coverPath)) {
      try {
        const bytes = await fs.readFile(coverPath);
        covers.set(coverPath, `data:image/jpeg;base64,${bytes.toString("base64")}`);
      } catch (error) {
        covers.set(coverPath, null);
        if (error.code !== "ENOENT") messages.push(`${coverPath}：封面读取失败，${error.message}`);
      }
    }
    const image = covers.get(coverPath);
    if (image) updates.push({ path: file.path, image });
  }
  messages.push(`已提交 ${updates.length} 个音频封面供人工 Accept，已有封面的音频保持不变。`);
  return { updates, messages };
}
