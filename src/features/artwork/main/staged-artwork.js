import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readTags, writeTags } from "../../audio-tags/main/audio-tag-storage.js";
import { logEvent } from "../../../shared/main/logging.js";
import { projectWorkspace, ensureProjectWorkspace } from "../../music-library/main/project-workspace.js";

const STAGE_PREFIX = "artwork-";

/** Store a durable, per-track proposal without touching artist directories. */
export async function stageArtwork(root, audioPath, jpeg, filenames) {
  const directory = await ensureProjectWorkspace(root);
  const token = `${STAGE_PREFIX}${randomUUID()}`;
  await fs.writeFile(path.join(directory, `${token}.jpg`), jpeg, { flag: "wx" });
  try {
    await fs.writeFile(path.join(directory, `${token}.json`), JSON.stringify({ audioPath, filenames }), { flag: "wx" });
  } catch (error) {
    await fs.unlink(path.join(directory, `${token}.jpg`));
    throw error;
  }
  logEvent("INFO", "artwork", `图片已暂存，等待 Accept：${audioPath}`);
  return { token, image: `data:image/jpeg;base64,${jpeg.toString("base64")}`, filenames };
}

/** Resolve a proposal only within its owning library's staging directory. */
async function readProposal(audioPath, token) {
  if (typeof audioPath !== "string" || typeof token !== "string" || !/^artwork-[a-f0-9-]{36}$/.test(token)) throw new Error("Invalid artwork proposal / 图片提案无效");
  const artistDirectory = path.dirname(path.resolve(audioPath));
  const stageDirectory = projectWorkspace(path.dirname(artistDirectory));
  const prefix = path.join(stageDirectory, token);
  const proposal = JSON.parse(await fs.readFile(`${prefix}.json`, "utf8"));
  if (proposal.audioPath !== audioPath || !Array.isArray(proposal.filenames) || proposal.filenames.some((name) => !["artist.jpg", "cover.jpg"].includes(name))) throw new Error("Invalid artwork proposal / 图片提案无效");
  return { prefix, artistDirectory, filenames: proposal.filenames };
}

/** Accept directory artwork and missing embedded cover as one review operation. */
export async function acceptArtwork(audioPath, tags, token) {
  const proposal = await readProposal(audioPath, token);
  const currentTags = readTags(audioPath);
  const jpeg = await fs.readFile(`${proposal.prefix}.jpg`);
  for (const filename of proposal.filenames) {
    const destination = path.join(proposal.artistDirectory, filename);
    try {
      await fs.copyFile(`${proposal.prefix}.jpg`, destination, constants.COPYFILE_EXCL);
      logEvent("INFO", "artwork", `Accept 已保存图片：${destination}`);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const acceptedTags = { ...tags };
  if (currentTags.image) acceptedTags.image = currentTags.image;
  else if (tags.image === `data:image/jpeg;base64,${jpeg.toString("base64")}`) {
    const cover = await fs.readFile(path.join(proposal.artistDirectory, "cover.jpg"));
    acceptedTags.image = `data:image/jpeg;base64,${cover.toString("base64")}`;
  }
  const saved = Object.keys(acceptedTags).some((key) => acceptedTags[key] !== currentTags[key])
    ? await writeTags(audioPath, acceptedTags)
    : { ok: true, tags: currentTags, path: audioPath, name: path.basename(audioPath) };
  try {
    await fs.rm(`${proposal.prefix}.jpg`, { force: true });
    await fs.rm(`${proposal.prefix}.json`, { force: true });
  } catch (error) { logEvent("WARN", "artwork", `已保存，暂存清理失败：${error.message}`); }
  return saved;
}

/** Discard only the staged proposal; artist files remain untouched. */
export async function discardArtwork(audioPath, token) {
  const proposal = await readProposal(audioPath, token);
  await fs.rm(`${proposal.prefix}.jpg`, { force: true });
  await fs.rm(`${proposal.prefix}.json`, { force: true });
  logEvent("INFO", "artwork", `已放弃暂存图片：${audioPath}`);
}
