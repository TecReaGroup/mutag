import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import imageGeneratePrompt from "../../../../data/prompt/image_generate_prompt.md?raw";
import { stageArtwork } from "./staged-artwork.js";
import { collectArtistDirectories } from "./library-artwork.js";
import { logEvent } from "../../../shared/main/logging.js";

const { nativeImage } = createRequire(import.meta.url)("electron");
const IMAGE_NAMES = ["artist.jpg", "cover.jpg"];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const JPEG_QUALITY = 90;

/** Decode provider output into a bounded JPEG. */
async function decodeGeneratedImage(encoded, url, signal) {
  let bytes;
  if (encoded) {
    if (encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new Error("生成图片超过 20 MB");
    bytes = Buffer.from(encoded, "base64");
  } else if (url) {
    const imageUrl = new URL(url);
    if (!["http:", "https:"].includes(imageUrl.protocol)) throw new Error("图片地址必须使用 HTTP 或 HTTPS");
    const response = await fetch(imageUrl, { signal });
    if (!response.ok) throw new Error(`生成图片下载失败：HTTP ${response.status}`);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > MAX_IMAGE_BYTES) throw new Error("生成图片超过 20 MB");
      chunks.push(chunk);
    }
    bytes = Buffer.concat(chunks);
  } else throw new Error("模型未返回生成的图片");
  const image = nativeImage.createFromBuffer(bytes);
  if (image.isEmpty()) throw new Error("生成内容不是可解码的图片");
  const jpeg = image.toJPEG(JPEG_QUALITY);
  if (!jpeg.length) throw new Error("生成图片转换 JPEG 失败");
  return jpeg;
}

/** Adapt image generation to native Gemini and OpenAI-compatible endpoints. */
async function requestArtistImage(model, artist) {
  const prompt = imageGeneratePrompt.replaceAll("<artist>", () => artist);
  const signal = AbortSignal.timeout(model.timeoutSeconds * 1000);
  const headers = { "Content-Type": "application/json", ...(model.apiKey ? { Authorization: `Bearer ${model.apiKey}` } : {}) };
  const baseURL = model.baseURL.trim().replace(/\/+$/, "");
  let response;
  if (/gemini/i.test(model.model)) {
    const origin = baseURL.replace(/\/v1beta\/openai$|\/v1(?:beta)?$/, "");
    response = await fetch(`${origin}/v1beta/models/${encodeURIComponent(model.model.replace(/^models\//, ""))}:generateContent`, {
      method: "POST", headers: { ...headers, ...(model.apiKey ? { "x-goog-api-key": model.apiKey } : {}) }, signal,
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
    });
  } else {
    response = await fetch(`${baseURL}/images/generations`, {
      method: "POST", headers, signal,
      body: JSON.stringify({ model: model.model, prompt, n: 1, size: "1024x1024" }),
    });
  }
  if (!response.ok) throw new Error(`图片生成请求失败：HTTP ${response.status}`);
  const completion = await response.json();
  const inlineImage = completion.candidates?.[0]?.content?.parts?.find((part) => !part.thought && part.inlineData?.mimeType?.startsWith("image/"))?.inlineData;
  return decodeGeneratedImage(inlineImage?.data ?? completion.data?.[0]?.b64_json, completion.data?.[0]?.url, signal);
}

/** Generate once per artist and preserve any artwork already present. */
export async function generateLibraryImages(root, files, model) {
  const artists = await collectArtistDirectories(root, files);
  if (!model || !/image/i.test(model.model) || model.imageGeneration !== true) throw new Error("请在当前 LLM 的 image 模型设置中开启图片生成。");
  if (!model.baseURL?.trim() || !Number.isFinite(model.timeoutSeconds) || model.timeoutSeconds <= 0) throw new Error("请配置有效的 LLM 接口地址和等待时间。");
  const messages = [];
  const proposals = [];
  let written = 0;
  for (const [directory, { artist }] of artists) {
    try {
      const missing = [];
      for (const filename of IMAGE_NAMES) {
        try {
          await fs.lstat(path.join(directory, filename));
          messages.push(`${artist}/${filename} 已存在，保留。`);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          missing.push(filename);
        }
      }
      if (!missing.length) continue;
      logEvent("INFO", "artwork", `开始生成歌手图片：${artist}，模型=${model.model}`);
      const jpeg = await requestArtistImage(model, artist);
      const tracks = files.filter((file) => path.dirname(file.path) === directory);
      for (const file of tracks) {
        const pendingArtwork = await stageArtwork(root, file.path, jpeg, missing);
        proposals.push({ path: file.path, pendingArtwork });
      }
      written += 1;
      messages.push(`${artist} 图片已暂存到 .temp/，Accept 后保存到歌手目录。`);
    } catch (error) {
      messages.push(`${artist}：${error.message}`);
      logEvent("ERROR", "artwork", `${artist} 图片生成失败：${error.message}`);
    }
  }
  const summary = `图片生成完成：检查 ${artists.size} 个歌手目录，暂存 ${written} 张图片，等待人工 Accept。`;
  for (const message of messages) logEvent("INFO", "artwork", message);
  logEvent("INFO", "artwork", summary);
  return { proposals, messages: [summary, ...messages] };
}
