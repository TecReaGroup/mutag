import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";
import type { ArtworkOutcome } from "../contracts";

/** Merge cover proposals into the existing tag review workflow. */
function proposeCovers(context: ChatCommandContext, artwork: ArtworkOutcome): ChatCommandOutcome {
  const images = new Map(artwork.updates.map((update) => [update.path, update.image]));
  const proposals = new Map(artwork.proposals?.map((proposal) => [proposal.path, proposal.pendingArtwork]));
  return {
    files: context.files.map((file) => {
      const pendingArtwork = proposals.get(file.path);
      const image = images.get(file.path) ?? (pendingArtwork?.filenames.includes("cover.jpg") ? pendingArtwork.image : undefined);
      const proposedFile = pendingArtwork ? { ...file, pendingArtwork } : file;
      return image && !file.savedTags.image && !(file.tempTags ?? file.savedTags).image
        ? { ...proposedFile, tempTags: { ...(file.tempTags ?? file.savedTags), image } } : proposedFile;
    }),
    selectedId: context.selectedId,
    message: artwork.messages.join("\n"),
  };
}

/** Fill missing artist images while preserving the current audio file state. */
async function executeImage(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error("请先打开需要补充图片的音乐目录。");
  const artwork = await api.downloadImages(context.projectRoot, context.openAI);
  return proposeCovers(context, artwork);
}

/** Generate artist artwork and propose missing embedded covers. */
async function executeImageGeneration(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error("请先打开需要补充图片的音乐目录。");
  return proposeCovers(context, await api.generateImages(context.projectRoot, context.openAI));
}

export const imageGenerationCommand: ChatCommand = {
  name: "/image_gen",
  descriptionEn: "Stage generated artwork in .temp; accept to save artist images and missing audio covers.",
  description: "生成图片暂存于 .temp；Accept 后保存歌手图片和缺失的音频封面",
  progressMessage: "正在生成歌手图片并准备待审核封面…",
  execute: executeImageGeneration,
};

export const imageCommand: ChatCommand = {
  name: "/image",
  descriptionEn: "Download missing artwork for organised artist folders; review and accept embedded cover changes.",
  description: "为已整理的歌手目录下载缺失图片；音频封面需人工 Accept",
  progressMessage: "正在查询并下载缺失图片…",
  execute: executeImage,
};
