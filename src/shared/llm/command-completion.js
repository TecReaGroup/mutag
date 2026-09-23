import { requestChatCompletion } from "./chat-completion.js";
import { requestGeminiContent } from "./gemini-content.js";

/** Enable native search for command requests when the Gemini profile allows it. */
export async function requestCommandCompletion(model, messages) {
  if (!/gemini/i.test(model.model) || model.webSearch !== true) return requestChatCompletion(model, messages);
  const instructions = messages.filter((message) => message.role === "system").map((message) => ({ text: message.content }));
  const contents = messages.filter((message) => message.role !== "system").map((message) => ({
    role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }],
  }));
  const content = await requestGeminiContent(model, contents, instructions.length ? { parts: instructions } : undefined);
  if (!content.trim()) throw new Error("LLM 未返回对话内容。");
  return content;
}
