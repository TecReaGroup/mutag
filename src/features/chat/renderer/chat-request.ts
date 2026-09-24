import type { AudioFile } from "../../audio-tags/contracts";
import type { ModelConfig } from "../../settings/contracts";
import type { ChatMessage } from "../contracts";
import { requestChatCompletion } from "../../../shared/llm/chat-completion.js";

const CHAT_INSTRUCTIONS = "You are a helpful music assistant. Reply conversationally in the user's language. " +
  "The supplied audio tags are context only. This conversation cannot modify files or metadata. " +
  "For metadata completion suggest /meta, for file organisation /organise, for artwork downloads /image, and for AI-generated artwork /image_gen. " +
  "Do not claim to have executed commands or searched websites without tools.";

/** Send a conversational request with artwork omitted from the file context. */
export async function requestChat(model: ModelConfig, files: AudioFile[], messages: ChatMessage[], signal: AbortSignal): Promise<string> {
  const tags = Object.fromEntries(files.map((file) => [file.id, Object.fromEntries(Object.entries(file.savedTags).map(([key, value]) => [key, key === "image" && value ? "[cover image]" : value]))]));
  return requestChatCompletion(model, [
    { role: "system", content: CHAT_INSTRUCTIONS },
    { role: "user", content: `Files:\n${JSON.stringify(tags, null, 2)}` },
    ...messages,
  ], signal);
}
