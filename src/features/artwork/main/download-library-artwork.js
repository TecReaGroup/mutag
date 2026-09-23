import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import imageDownloadPrompt from "../../../../data/prompt/image_download_prompt.md?raw";
import { logEvent } from "../../../shared/main/logging.js";
import { filenameFromTag } from "../../music-library/main/library-paths.js";
import { requestCommandCompletion } from "../../../shared/llm/command-completion.js";

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
  const content = await requestCommandCompletion(openAI, [
        { role: "system", content: imageDownloadPrompt },
        { role: "user", content: JSON.stringify({ requests }) },
  ]);
  logEvent("INFO", "llm", `图片链接请求完成，模型=${openAI.model}`);
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
