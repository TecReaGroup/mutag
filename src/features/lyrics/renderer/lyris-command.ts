import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";

/** Refresh saved lyrics while retaining unrelated pending tag edits. */
async function executeLyris(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  if (!window.audioTagApi || !context.projectRoot || !context.files.length) throw new Error("请先打开包含音频文件的目录。");
  const generated = await window.audioTagApi.generateLyrics(context.projectRoot, context.openAI);
  const lyricsByPath = new Map(generated.updates.map((track) => [track.path, track.lyrics]));
  return {
    files: context.files.map((file) => {
      const lyrics = lyricsByPath.get(file.path);
      return lyrics === undefined ? file : { ...file, savedTags: { ...file.savedTags, lyrics }, tempTags: file.tempTags ? { ...file.tempTags, lyrics } : null };
    }),
    selectedId: context.selectedId,
    message: generated.messages.join("\n"),
  };
}

export const lyrisCommand: ChatCommand = {
  name: "/lyris",
  description: "为当前目录所有音频生成 LRC 歌词并直接写入 lyrics 标签（覆盖已有歌词）",
  progressMessage: "正在生成 LRC 歌词并写入音频标签…",
  execute: executeLyris,
};
