import type { ChatCommand } from "../../features/music-library/command-contracts";
import type { Translate } from "../../shared/renderer/localization";
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
    const available = CHAT_COMMANDS.filter((entry) => !disabledCommands.includes(entry.name)).map((entry) => entry.name).join(", ") || t("None. Enable commands in Settings.", "无，请在设置中启用命令。");
    throw new Error(t(`Unknown command: ${input}. Available commands: ${available}`, `未知命令：${input}。可用命令：${available}`));
  }
  if (disabledCommands.includes(command.name)) throw new Error(t(`${command.name} is disabled. Enable it in Settings → Commands.`, `${command.name} 未启用，请在设置 → 命令管理中启用。`));
  if (match?.[2]) throw new Error(t(`${command.name} does not accept arguments. Send the command on its own.`, `${command.name} 不接受额外参数，请单独发送该命令。`));
  return command;
}
