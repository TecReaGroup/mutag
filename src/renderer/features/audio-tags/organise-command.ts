import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "./chat-commands";

/** Save the current project, organise its files, and reconcile moved paths. */
async function executeOrganise(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  const api = window.audioTagApi;
  if (!api || !context.projectRoot) throw new Error("请先打开需要整理的音乐目录。");
  await api.saveProjectState(context.projectRoot, {
    selectedId: context.selectedId,
    files: Object.fromEntries(context.files.map((file) => [file.id, { tempTags: file.tempTags }])),
    chatMessages: context.chatMessages,
  });
  const organisation = await api.organise(context.projectRoot, context.openAI);
  const movesByPath = new Map(organisation.moves.map((move) => [move.originalPath, move]));
  return {
    files: context.files.map((file) => {
      const move = movesByPath.get(file.path);
      return move ? { ...file, id: move.path, path: move.path, name: move.name } : file;
    }),
    selectedId: movesByPath.get(context.selectedId)?.path ?? context.selectedId,
    message: organisation.messages.join("\n"),
  };
}

export const organiseCommand: ChatCommand = {
  name: "/organise",
  description: "按歌手整理文件，并补充缺失的 artist.jpg 和 cover.jpg；发送后执行",
  progressMessage: "正在整理文件并补充缺失图片…",
  execute: executeOrganise,
};
