import type { AudioFile } from "../audio-tags/contracts";
import type { ModelConfig } from "../settings/contracts";
import type { ChatMessage, ChatCommand as ConversationCommand } from "../chat/contracts";

export interface ChatCommandContext {
  projectRoot: string;
  files: AudioFile[];
  selectedId: string;
  chatMessages: ChatMessage[];
  openAI: ModelConfig;
}

export interface ChatCommandOutcome {
  files: AudioFile[];
  selectedId: string;
  message: string;
}

export type ChatCommand = ConversationCommand<ChatCommandContext, ChatCommandOutcome>;
