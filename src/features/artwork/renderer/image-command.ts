import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";

/** Fill missing artist images while preserving the current audio file state. */
async function executeImage(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error("请先打开需要补充图片的音乐目录。");
  const artwork = await api.downloadImages(context.projectRoot, context.openAI);
  return {
    files: context.files,
    selectedId: context.selectedId,
    message: artwork.messages.join("\n"),
  };
}

export const imageCommand: ChatCommand = {
  name: "/image",
  description: "为已整理的歌手目录查询并下载缺失的 artist.jpg 和 cover.jpg；发送后执行",
  progressMessage: "正在查询并下载缺失图片…",
  execute: executeImage,
};
