import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AudioFile } from "../../audio-tags/contracts";
import type { ModelConfig } from "../../settings/contracts";
import type { ChatMessage } from "../contracts";
import type { ChatCommand } from "../../music-library/command-contracts";
import { hasTagChanges } from "../../audio-tags/renderer/tag-fields";
import { errorMessage } from "../../../shared/renderer/error-message";
import { requestChat } from "./chat-request";

interface ConversationSource {
  root: string; files: AudioFile[]; selectedId: string; messages: ChatMessage[];
  setFiles: Dispatch<SetStateAction<AudioFile[]>>; setSelectedId: Dispatch<SetStateAction<string>>; setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

/** Own chat cancellation and command execution against a persisted library snapshot. */
export function useConversation(session: ConversationSource, model: ModelConfig, resolveCommand: (text: string) => ChatCommand | null, flushProject: () => Promise<unknown>) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeCommand, setActiveCommand] = useState<ChatCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const running = useRef(false);
  useEffect(() => () => abortRef.current?.abort(), []);
  const send = async () => {
    const text = input.trim();
    if (!text || running.current) return;
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: text };
    let command: ChatCommand | null;
    try { command = resolveCommand(text); }
    catch (failure) {
      const message = errorMessage(failure); setError(message);
      window.audioTagApi?.logEvent("ERROR", "command", `命令解析失败：${message}`);
      session.setMessages((previous) => [...previous, userMessage, { role: "assistant", content: message }]);
      return;
    }
    if (command && session.files.some(hasTagChanges)) {
      window.audioTagApi?.logEvent("WARN", "command", `${command.name} 未执行：存在待处理修改，请先保存或丢弃。`);
      setError("请先保存或丢弃待处理修改，再执行命令。"); return;
    }
    running.current = true; setSending(true); setInput("");
    session.setMessages((previous) => [...previous, userMessage]);
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();
    const operation = command?.name ?? "对话请求";
    const module = command ? "command" : "chat";
    window.audioTagApi?.logEvent("INFO", module, `开始执行 ${operation}，模型=${model.model}，文件数=${session.files.length}，等待上限=${model.timeoutSeconds}秒`);
    controller.signal.addEventListener("abort", () => {
      window.audioTagApi?.logEvent("INFO", module, `${operation} 收到停止请求，耗时=${Date.now() - startedAt}毫秒`);
    }, { once: true });
    try {
      if (command) {
        setActiveCommand(command);
        await flushProject();
        if (controller.signal.aborted) return;
        const outcome = await command.execute({ projectRoot: session.root, files: session.files, selectedId: session.selectedId, chatMessages: [...session.messages, userMessage], openAI: model, signal: controller.signal });
        if (controller.signal.aborted) return;
        session.setFiles(outcome.files); session.setSelectedId(outcome.selectedId);
        session.setMessages((previous) => [...previous, { role: "assistant", content: outcome.message }]);
      } else {
        const content = await requestChat(model, session.files, [...session.messages, userMessage], controller.signal);
        if (controller.signal.aborted) return;
        session.setMessages((previous) => [...previous, { role: "assistant", content }]);
      }
      window.audioTagApi?.logEvent("INFO", module, `${operation} 执行结束，耗时=${Date.now() - startedAt}毫秒`);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const message = errorMessage(failure);
      window.audioTagApi?.logEvent("ERROR", module, `${operation} 执行失败，耗时=${Date.now() - startedAt}毫秒：${message}`);
      setError(message);
      session.setMessages((previous) => [...previous, { role: "assistant", content: command ? `${command.name} 执行失败：${message}` : message }]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null; running.current = false; setSending(false); setActiveCommand(null);
      }
    }
  };
  const stop = () => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    abortRef.current = null; running.current = false; setSending(false); setActiveCommand(null);
    session.setMessages((previous) => [...previous, { role: "assistant", content: activeCommand ? `${activeCommand.name} 已停止。` : "对话已停止。" }]);
  };
  return { input, setInput, sending, activeCommand, error, send, stop, clear: () => session.setMessages([]) };
}
