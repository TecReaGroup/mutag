import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";

/** Generate missing lyrics as pending edits for review. */
async function executeLyris(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  if (!window.audioTagApi || !context.projectRoot || !context.files.length) throw new Error("请先打开包含音频文件的目录。");
  const paths = context.files.filter((file) => !file.savedTags.lyrics?.trim() && !file.tempTags?.lyrics?.trim()).map((file) => file.path);
  if (!paths.length) return { files: context.files, selectedId: context.selectedId, message: "所有歌曲均已有歌词，已跳过，无需生成。" };
  const generated = await window.audioTagApi.generateLyrics(context.projectRoot, context.openAI, paths);
  const lyricsByPath = new Map(generated.updates.map((track) => [track.path, track.lyrics]));
  return {
    files: context.files.map((file) => {
      const lyrics = lyricsByPath.get(file.path);
      return lyrics === undefined ? file : { ...file, tempTags: { ...(file.tempTags ?? file.savedTags), lyrics } };
    }),
    selectedId: context.selectedId,
    message: generated.messages.join("\n"),
  };
}

export const lyrisCommand: ChatCommand = {
  name: "/lyris",
  description: "为缺失歌词的音频生成 LRC 歌词，跳过已有歌词，审阅后保存",
  progressMessage: "正在为缺失歌词的音频生成待审阅 LRC 歌词…",
  execute: executeLyris,
};
