import fs from "node:fs/promises";
import path from "node:path";

/** Validate an externally supplied library directory. */
export async function resolveProjectRoot(payload) {
  if (!payload || typeof payload.root !== "string" || !payload.root.trim()) throw new Error("请先打开音乐目录");
  const root = path.resolve(payload.root);
  if (!(await fs.stat(root)).isDirectory()) throw new Error("音乐目录不存在");
  return root;
}

/** Convert a tag to a portable, single filename component. */
export function filenameFromTag(value) {
  const filename = String(value ?? "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
  if (!filename || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
    throw new Error("歌手或歌名为空，或不能用作文件名");
  }
  return filename;
}
