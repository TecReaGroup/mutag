import type { ChatCommand, ChatCommandContext, ChatCommandOutcome } from "../../music-library/command-contracts";

/** Generate missing lyrics as pending edits for review. */
async function executeLyris(context: ChatCommandContext): Promise<ChatCommandOutcome> {
  if (!window.audioTagApi || !context.projectRoot || !context.files.length) throw new Error(context.t("commands.openAudioFolder"));
  const paths = context.files.filter((file) => !file.savedTags.lyrics?.trim() && !file.tempTags?.lyrics?.trim()).map((file) => file.path);
  if (!paths.length) return { files: context.files, selectedId: context.selectedId, message: context.t("commands.lyrics.skipped") };
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
  descriptionKey: "commands.lyrics.description",
  progressKey: "commands.lyrics.progress",
  execute: executeLyris,
};
