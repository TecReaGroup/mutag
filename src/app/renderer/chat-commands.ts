import type { ChatCommand } from "../../features/music-library/command-contracts";
import type { Translate } from "../../shared/localization";
import { organiseCommand } from "../../features/music-library/renderer/organise-command";
import { imageCommand, imageGenerationCommand } from "../../features/artwork/renderer/image-command";
import { metaCommand } from "../../features/audio-tags/renderer/meta-command";
import { lyrisCommand } from "../../features/lyrics/renderer/lyris-command";

export const CHAT_COMMANDS: readonly ChatCommand[] = [metaCommand, organiseCommand, imageCommand, imageGenerationCommand, lyrisCommand];

/** Resolve slash commands locally; reject unknown names and unsupported arguments. */
export function resolveChatCommand(text: string, disabledCommands: readonly string[], t: Translate): ChatCommand | null {
  const input = text.trim();
  if (!input.startsWith("/")) return null;
  const match = input.match(/^\/\s*([^\s]+)(?:\s+([\s\S]*))?$/);
  const command = CHAT_COMMANDS.find((entry) => entry.name === `/${match?.[1]}`);
  if (!command) {
    const available = CHAT_COMMANDS.filter((entry) => !disabledCommands.includes(entry.name)).map((entry) => entry.name).join(", ") || t("commands.noneAvailable");
    throw new Error(t("commands.unknown", { input, available }));
  }
  if (disabledCommands.includes(command.name)) throw new Error(t("commands.disabled", { command: command.name }));
  if (match?.[2]) throw new Error(t("commands.noArguments", { command: command.name }));
  return command;
}
