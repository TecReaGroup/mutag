import type { ChatCommand } from "../../features/music-library/command-contracts";
import { organiseCommand } from "../../features/music-library/renderer/organise-command";
import { imageCommand } from "../../features/artwork/renderer/image-command";
import { metaCommand } from "../../features/audio-tags/renderer/meta-command";

export const CHAT_COMMANDS: readonly ChatCommand[] = [metaCommand, organiseCommand, imageCommand];

/** Resolve slash commands locally; reject unknown names and unsupported arguments. */
export function resolveChatCommand(text: string): ChatCommand | null {
  const input = text.trim();
  if (!input.startsWith("/")) return null;
  const match = input.match(/^\/\s*([^\s]+)(?:\s+([\s\S]*))?$/);
  const command = CHAT_COMMANDS.find((entry) => entry.name === `/${match?.[1]}`);
  if (!command) {
    throw new Error(`未知命令：${input}。可用命令：${CHAT_COMMANDS.map((entry) => entry.name).join("、")}`);
  }
  if (match?.[2]) throw new Error(`${command.name} 不接受额外参数，请单独发送该命令。`);
  return command;
}
