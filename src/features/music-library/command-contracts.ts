import type { AudioFile } from "../audio-tags/contracts";
import type { ModelConfig } from "../settings/contracts";
import type { ChatMessage, ChatCommand as ConversationCommand } from "../chat/contracts";
import type { Translate } from "../../shared/localization";

export interface ChatCommandContext {
  projectRoot: string;
  files: AudioFile[];
  selectedId: string;
  chatMessages: ChatMessage[];
  openAI: ModelConfig;
  signal: AbortSignal;
  t: Translate;
}

export interface ChatCommandOutcome {
  files: AudioFile[];
  selectedId: string;
  message: string;
}

export type ChatCommand = ConversationCommand<ChatCommandContext, ChatCommandOutcome>;
