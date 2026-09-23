import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import imageDownloadPrompt from "../../../../data/prompt/image_download_prompt.md?raw";
import { logEvent } from "../../../shared/main/logging.js";

const require = createRequire(import.meta.url);
const { nativeImage } = require("electron");
const IMAGE_NAMES = ["artist.jpg", "cover.jpg"];
const REQUEST_TIMEOUT_MS = 60000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const JPEG_QUALITY = 90;
const ARTWORK_SEARCH_TIMEOUT_MS = 15000;

/** Find published artwork instead of relying on URLs memorized by a model. */
async function searchArtworkCandidates(artist, songs, missing) {
  const candidates = [];
  const primaryArtist = artist.split(/\s+(?:feat\.?|ft\.?)\s+/i)[0].trim();
  const searches = [];
  if (missing.includes("artist.jpg")) {
    searches.push((async () => {
      const query = new URL("https://en.wikipedia.org/w/api.php");
      query.search = new URLSearchParams({
        action: "query", format: "json", generator: "search",
        gsrsearch: `${primaryArtist} music`, gsrlimit: "3",
        prop: "pageimages|description", piprop: "original",
      }).toString();
      const response = await fetch(query, { signal: AbortSignal.timeout(ARTWORK_SEARCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
      const pages = await response.json();
      for (const page of Object.values(pages.query?.pages ?? {})) {
        if (page.original?.source) candidates.push({
          filename: "artist.jpg", artist: page.title, description: page.description,
          url: page.original.source, source: "Wikipedia artist image",
        });
      }
    })());
  }
  if (missing.includes("cover.jpg")) {
    searches.push((async () => {
      const query = new URL("https://itunes.apple.com/search");
      query.search = new URLSearchParams({
        term: `${primaryArtist} ${songs[0]?.title ?? ""}`, entity: "song", limit: "10",
      }).toString();
      const response = await fetch(query, { signal: AbortSignal.timeout(ARTWORK_SEARCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Apple Music HTTP ${response.status}`);
      const releases = await response.json();
      for (const track of releases.results ?? []) {
        if (track.artworkUrl100) candidates.push({
          filename: "cover.jpg", artist: track.artistName, title: track.trackName,
          album: track.collectionName, url: track.artworkUrl100, source: "Apple Music release artwork",
        });
      }
    })());
  }
  const searchesCompleted = await Promise.allSettled(searches);
  for (const search of searchesCompleted) {
    if (search.status === "rejected") await logLibraryEvent("WARN", `${artist} 图片来源查询失败：${search.reason.message}`);
  }
  await logLibraryEvent("INFO", `${artist} 图片检索获得 ${candidates.length} 个候选`);
  return candidates;
}

/** Convert a tag to a portable, single filename component. */
function filenameFromTag(value) {
  const filename = String(value ?? "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
  if (!filename || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
    throw new Error("歌手或歌名为空，或不能用作文件名");
  }
  return filename;
}

/** Check existence without treating permission failures as missing files. */
async function exists(filePath) {
  try {
    await fs.lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Persist library operations in the project's daily UTC+8 log. */
async function logLibraryEvent(level, message) {
  logEvent(level, "music-library", message);
}

/** Ask the configured model only for artwork that is missing on disk. */
async function requestArtworkLinks(batch, openAI) {
  if (!openAI || typeof openAI.baseURL !== "string" || !openAI.baseURL.trim()
    || typeof openAI.model !== "string" || !openAI.model.trim()) {
    throw new Error("请先配置 LLM 的 Base URL 和 Model");
  }
  const requests = [];
  for (const { artist, songs, missing } of batch) {
    const candidates = await searchArtworkCandidates(artist, songs, missing);
    requests.push({ artist, songs, missing, candidates });
  }
  logEvent("INFO", "llm", `开始图片链接请求，模型=${openAI.model}，歌手数量=${batch.length}，等待上限=${openAI.timeoutSeconds}秒`);
  const response = await fetch(`${openAI.baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(openAI.apiKey ? { Authorization: `Bearer ${openAI.apiKey}` } : {}),
    },
    signal: AbortSignal.timeout((openAI.timeoutSeconds ?? REQUEST_TIMEOUT_MS / 1000) * 1000),
    body: JSON.stringify({
      model: openAI.model,
      messages: [
        { role: "system", content: imageDownloadPrompt },
        { role: "user", content: JSON.stringify({ requests }) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`LLM 请求失败：HTTP ${response.status}`);
  logEvent("INFO", "llm", `图片链接请求响应 HTTP ${response.status}，模型=${openAI.model}`);
  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;
  const json = typeof content === "string"
    ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").match(/\{[\s\S]*\}/)?.[0]
    : null;
  if (!json) throw new Error("LLM 未返回图片链接对象");
  let links;
  try {
    links = JSON.parse(json);
  } catch {
    throw new Error("模型返回的图片链接不是有效 JSON，请检查提示词要求的返回格式");
  }
  if (!links || typeof links !== "object" || Array.isArray(links)) throw new Error("LLM 返回格式无效");
  for (const { artist, missing, candidates } of requests) {
    if (!links[artist] || typeof links[artist] !== "object" || Array.isArray(links[artist])) throw new Error(`LLM 未返回 ${artist} 的图片链接对象`);
    for (const filename of missing) {
    const url = links[artist][filename];
    if (url !== null && (typeof url !== "string" || !/^https?:\/\//i.test(url.trim()))) {
      throw new Error(`LLM 返回的 ${filename} 必须是 HTTP 图片链接或 null`);
    }
    if (url === null) await logLibraryEvent("WARN", `${artist}/${filename}：模型未选出匹配图片，检索候选 ${candidates.filter((candidate) => candidate.filename === filename).length} 个`);
    }
  }
  return links;
}

/** Download a bounded image and create a real JPEG without overwriting a file. */
async function downloadArtwork(url, destination) {
  const imageUrl = new URL(url);
  if (!["https:", "http:"].includes(imageUrl.protocol)) throw new Error("图片链接必须使用 HTTP 或 HTTPS");
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`图片下载失败：HTTP ${response.status}`);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > MAX_IMAGE_BYTES) throw new Error("图片超过 20 MB，已跳过");
    chunks.push(chunk);
  }
  const image = nativeImage.createFromBuffer(Buffer.concat(chunks));
  if (image.isEmpty()) throw new Error("链接内容不是可解码的 PNG/JPEG 图片");
  const jpeg = image.toJPEG(JPEG_QUALITY);
  if (!jpeg.length) throw new Error("图片转换为 JPEG 失败");
  const output = await fs.open(destination, "wx");
  try {
    await output.writeFile(jpeg);
  } catch (error) {
    await output.close();
    await fs.unlink(destination);
    throw error;
  }
  await output.close();
}

/** Remove empty descendants bottom-up without following directory links. */
async function removeEmptyDirectories(root, messages) {
  let removed = 0;
  async function visit(directory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.isSymbolicLink()) await visit(path.join(directory, entry.name));
      }
      if (directory === root) return;
      // rmdir refuses nonempty directories, including files created during cleanup.
      await fs.rmdir(directory);
      removed += 1;
      await logLibraryEvent("INFO", `删除空文件夹 ${directory}`);
    } catch (error) {
      if (["ENOTEMPTY", "EEXIST", "ENOENT"].includes(error.code)) return;
      const warning = `空文件夹清理失败 ${directory}：${error.message}`;
      messages.push(warning);
      await logLibraryEvent("WARN", warning);
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
  await logLibraryEvent("INFO", `开始整理 ${root}，共 ${files.length} 个音频文件`);

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
        await logLibraryEvent("INFO", `移动 ${audioFile.path} -> ${destination}`);
      } else {
        unchanged += 1;
      }
    } catch (error) {
      skipped += 1;
      const reason = error.code === "EEXIST" ? "目标文件已存在" : error.message;
      messages.push(`跳过 ${audioFile.name}：${reason}`);
      await logLibraryEvent("WARN", messages[messages.length - 1]);
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
      await fs.writeFile(path.join(root, "mutag.json"), JSON.stringify(updatedState, null, 2), "utf8");
    } catch (error) {
      messages.push(`文件已整理，但项目状态保存失败：${error.message}`);
    }
  }

  const removedDirectories = await removeEmptyDirectories(realRoot, messages);
  const summary = `整理完成：移动 ${moves.length} 个文件，${unchanged} 个已在正确位置，跳过 ${skipped} 个，清理 ${removedDirectories} 个空文件夹。`;
  for (const message of messages) await logLibraryEvent("INFO", message);
  await logLibraryEvent("INFO", summary);
  return { moves, messages: [summary, ...messages] };
}

/** Fill missing artwork in existing artist directories without moving audio files. */
export async function downloadLibraryImages(root, files, openAI) {
  const realRoot = await fs.realpath(root);
  const artists = new Map();
  const messages = [];
  let downloaded = 0;
  const jobs = [];
  await logLibraryEvent("INFO", `开始补充图片 ${root}`);
  for (const audioFile of files) {
    try {
      const directory = path.join(root, filenameFromTag(audioFile.savedTags.artist));
      if (path.dirname(path.resolve(audioFile.path)) !== directory) {
        messages.push(`跳过 ${audioFile.name} 的图片查询：文件尚未归入歌手目录，请先执行 /organise。`);
        continue;
      }
      if (!artists.has(directory)) artists.set(directory, { artist: audioFile.savedTags.artist, songs: [] });
      artists.get(directory).songs.push({ title: audioFile.savedTags.title, album: audioFile.savedTags.album });
    } catch (error) {
      messages.push(`跳过 ${audioFile.name} 的图片查询：${error.message}`);
    }
  }

  for (const [directory, { artist, songs }] of artists) {
    try {
      const relativeDirectory = path.relative(realRoot, await fs.realpath(directory));
      if (relativeDirectory.startsWith(`..${path.sep}`) || relativeDirectory === ".." || path.isAbsolute(relativeDirectory)) {
        throw new Error("歌手目录指向当前音乐目录之外");
      }
      const missing = [];
      for (const filename of IMAGE_NAMES) {
        if (await exists(path.join(directory, filename))) messages.push(`${artist}/${filename} 已存在，保留。`);
        else missing.push(filename);
      }
      if (!missing.length) continue;
      jobs.push({ directory, artist, songs, missing });
    } catch (error) {
      messages.push(`${artist}：图片处理失败，${error.message}`);
    }
  }
  const batchSize = Math.max(1, Math.floor(openAI.filesPerRequest || 5));
  const concurrency = Math.max(1, Math.floor(openAI.concurrency || 1));
  const batches = [];
  for (let index = 0; index < jobs.length; index += batchSize) batches.push(jobs.slice(index, index + batchSize));
  let nextBatch = 0;
  await logLibraryEvent("INFO", `图片任务配置：模型=${openAI.model}，每批=${batchSize}，并发=${concurrency}，批次数=${batches.length}`);
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (nextBatch < batches.length) {
      const batchIndex = nextBatch++;
      const batch = batches[batchIndex];
      let batchLinks;
      try {
        batchLinks = await requestArtworkLinks(batch, openAI);
      } catch (error) {
        const failure = `图片第 ${batchIndex + 1} 批失败（${batch.map((job) => job.artist).join("、")}）：${error.message}`;
        messages.push(failure);
        await logLibraryEvent("ERROR", failure);
        continue;
      }
      for (const { directory, artist, missing } of batch) {
      const links = batchLinks[artist];
      for (const filename of missing) {
        const url = links[filename];
        if (typeof url !== "string" || !url.trim()) {
          messages.push(`${artist}/${filename}：LLM 未提供链接，已跳过。`);
          continue;
        }
        try {
          const destination = path.join(directory, filename);
          if (await exists(destination)) {
            messages.push(`${artist}/${filename} 已存在，保留。`);
            continue;
          }
          await downloadArtwork(url.trim(), destination);
          downloaded += 1;
          messages.push(`已下载 ${artist}/${filename}`);
        } catch (error) {
          messages.push(`${artist}/${filename}：${error.message}，已跳过。`);
        }
      }
      }
    }
  }));
  const summary = `图片处理完成：检查 ${artists.size} 个歌手目录，下载 ${downloaded} 张图片。`;
  for (const message of messages) await logLibraryEvent("INFO", message);
  await logLibraryEvent("INFO", summary);
  return { messages: [summary, ...messages] };
}
