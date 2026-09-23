import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { logEvent } from "../../../shared/main/logging.js";

const AUDIO_MIME_TYPES = { ".aac": "audio/aac", ".flac": "audio/flac", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };
const COMPRESSION_BITRATES = [64, 32];
const SAMPLE_RATE = 24000;
const COMPRESSION_TIMEOUT_MS = 10 * 60 * 1000;
const TEMP_DIRECTORY = path.resolve("temp");
const executeFile = promisify(execFile);

/** Prepare a complete audio attachment within the raw-byte upload budget. */
export async function prepareLyricsAudio(filePath, maxAudioBytes) {
  const mimeType = AUDIO_MIME_TYPES[path.extname(filePath).toLowerCase()];
  if (!mimeType) throw new Error("Gemini 音频上传不支持此文件格式。");
  const originalBytes = (await fs.stat(filePath)).size;
  if (originalBytes <= maxAudioBytes) return { mimeType, data: (await fs.readFile(filePath)).toString("base64") };
  if (!ffmpegPath) throw new Error("当前平台没有可用的 FFmpeg 音频压缩程序。");
  const executable = ffmpegPath.replace(/([\\/])app\.asar([\\/])/, "$1app.asar.unpacked$2");
  await fs.mkdir(TEMP_DIRECTORY, { recursive: true });
  const temporaryDirectory = await fs.mkdtemp(path.join(TEMP_DIRECTORY, "lyrics-audio-"));
  const compressedPath = path.join(temporaryDirectory, "upload.mp3");
  try {
    for (const bitrate of COMPRESSION_BITRATES) {
      logEvent("INFO", "lyrics", `压缩上传音频：${filePath}，原始字节=${originalBytes}，码率=${bitrate} kbps，单声道，采样率=${SAMPLE_RATE} Hz`);
      try {
        await executeFile(executable, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", filePath, "-map", "0:a:0", "-vn", "-map_metadata", "-1", "-c:a", "libmp3lame", "-ac", "1", "-ar", String(SAMPLE_RATE), "-b:a", `${bitrate}k`, compressedPath], { windowsHide: true, timeout: COMPRESSION_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
      } catch (error) {
        throw new Error(`音频压缩失败：${error.killed ? "转码超时" : error.stderr?.trim() || error.message}`);
      }
      const compressedBytes = (await fs.stat(compressedPath)).size;
      if (compressedBytes <= maxAudioBytes) {
        logEvent("INFO", "lyrics", `上传音频压缩完成：${filePath}，压缩后字节=${compressedBytes}，码率=${bitrate} kbps`);
        return { mimeType: "audio/mpeg", data: (await fs.readFile(compressedPath)).toString("base64") };
      }
    }
    throw new Error("音频压缩至 32 kbps 后仍超过 Gemini 内联上传限制，完整音频过长。");
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch((error) => {
      logEvent("WARN", "lyrics", `无法清理压缩临时目录 ${temporaryDirectory}：${error.message}`);
    });
  }
}
