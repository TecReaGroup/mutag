import metadataPrompt from "../../../../data/prompt/metadata_prompt.md?raw";
import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";
import { normalizeTagKey, SUPPORTED_TAG_KEYS } from "../tag-rules.js";
import { requestCommandCompletion } from "../../../shared/llm/command-completion.js";

const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_CONCURRENCY = 1;
const PROTECTED_FIELDS = new Set(["title", "lyrics", "image", "album_artist"]);

/** Complete missing metadata as pending edits using the project's default prompt. */
async function executeMeta(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  if (!context.files.length) throw new Error("请先打开包含音频文件的目录。");
  const positiveInteger = (value: number, fallback: number) => Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
  const batchSize = positiveInteger(context.openAI.filesPerRequest, DEFAULT_BATCH_SIZE);
  const concurrency = positiveInteger(context.openAI.concurrency, DEFAULT_CONCURRENCY);
  const batches: ChatCommandContext["files"][] = [];
  for (let index = 0; index < context.files.length; index += batchSize) batches.push(context.files.slice(index, index + batchSize));
  const completedFiles = new Map(context.files.map((file) => [file.id, file]));
  const failures: string[] = [];
  let nextBatch = 0;
  let changedCount = 0;

  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (nextBatch < batches.length) {
      const batchIndex = nextBatch++;
      const batch = batches[batchIndex];
      try {
        const content = await requestCommandCompletion(context.openAI, [
              { role: "system", content: metadataPrompt },
              { role: "user", content: JSON.stringify(Object.fromEntries(batch.map((file) => {
                const { image, ...tags } = file.savedTags;
                return [file.id, { name: file.name, tags }];
              }))) },
        ]);
        const json = typeof content === "string" ? content.match(/\{[\s\S]*\}/)?.[0] : null;
        if (!json) throw new Error("未返回元数据 JSON");
        let updates;
        try {
          updates = JSON.parse(json);
        } catch {
          throw new Error("模型返回的元数据不是有效 JSON，请检查提示词要求的返回格式");
        }
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) throw new Error("元数据格式无效");
        for (const file of batch) {
          const proposedTags = updates[file.id];
          if (proposedTags !== undefined && (!proposedTags || typeof proposedTags !== "object" || Array.isArray(proposedTags))) {
            throw new Error(`${file.name} 的元数据格式无效`);
          }
          for (const [key, value] of Object.entries(proposedTags ?? {})) {
            if (typeof value !== "string") throw new Error(`${file.name} 的 ${key} 格式无效，应为字符串`);
          }
        }
        for (const file of batch) {
          const tags = { ...(file.tempTags ?? file.savedTags) };
          for (const [rawKey, value] of Object.entries(updates[file.id] ?? {})) {
            const key = normalizeTagKey(rawKey);
            if (!SUPPORTED_TAG_KEYS.has(key) || PROTECTED_FIELDS.has(key)) continue;
            if (tags[key]?.trim()) continue;
            if (typeof value === "string" && value.trim()) tags[key] = value.trim();
          }
          if (Object.keys(tags).some((key) => tags[key] !== (file.tempTags ?? file.savedTags)[key])) {
            completedFiles.set(file.id, { ...file, tempTags: tags });
            changedCount += 1;
          }
        }
      } catch (error) {
        failures.push(`第 ${batchIndex + 1} 批失败：${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }));
  return {
    files: context.files.map((file) => completedFiles.get(file.id)!),
    selectedId: context.selectedId,
    message: [`元数据补齐完成：${changedCount} 个文件产生待确认修改，请检查后保存。`, ...failures].join("\n"),
  };
}

export const metaCommand: ChatCommand = {
  name: "/meta",
  descriptionEn: "Complete missing metadata using the default prompt; review changes before saving.",
  description: "使用默认提示词补齐缺失元数据，生成待确认修改；发送后执行",
  progressMessage: "正在补齐音频元数据…",
  execute: executeMeta,
};
