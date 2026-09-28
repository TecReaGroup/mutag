import { useRef } from "react";
import type { ChatMessage } from "../contracts";
import type { ChatCommand } from "../../music-library/command-contracts";
import type { ModelConfig } from "../../settings/contracts";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { Button, PanelHeader } from "../../../shared/renderer/controls";
import { SelectField } from "../../../shared/renderer/SelectField";
import { ErrorNotice } from "../../../shared/renderer/ErrorNotice";

interface ChatPanelProps {
  messages: ChatMessage[]; input: string; onInput: (input: string) => void;
  sending: boolean; activeCommand: ChatCommand | null; error: string | null;
  onSend: () => void; onStop: () => void; onClear: () => void;
  models: ModelConfig[]; activeModel: ModelConfig; onModelChange: (model: ModelConfig) => void;
  commands: readonly ChatCommand[]; fileCount: number; dirtyCount: number; disabled: boolean; scanning: boolean;
}

export function ChatPanel({ messages, input, onInput, sending, activeCommand, error, onSend, onStop, onClear, models, activeModel, onModelChange, commands, fileCount, dirtyCount, disabled, scanning }: ChatPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputDisabled = sending || disabled || scanning;
  return <>
    <PanelHeader className="bg-background"><span className="text-[10px] text-subtle">{t("chat.summary", { count: fileCount, batchSize: activeModel.filesPerRequest, concurrency: activeModel.concurrency })}</span></PanelHeader>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" role="log" aria-label={t("chat.conversation")}>
      {!messages.length && <p className="text-[10px] italic text-subtle">{t("chat.empty")}</p>}
      {messages.map((message, index) => <div key={index} className={`whitespace-pre-wrap break-words rounded px-2 py-1.5 text-xs ${message.role === "user" ? "bg-accent" : "border border-border bg-background"}`}><div className="ui-field-label mb-0.5">{t(`chat.role.${message.role}`)}</div>{message.content}</div>)}
      {sending && <p className="text-[10px] italic text-subtle">{activeCommand ? t(activeCommand.progressKey) : t("chat.sending")}</p>}
    </div>
    <div className="shrink-0 space-y-1.5 border-t border-border p-2">
      {error && <ErrorNotice message={error} />}
      <div className="flex items-center gap-2">{disabled ? <p className="min-w-0 flex-1 text-[10px] text-warning">{activeCommand ? t(activeCommand.progressKey) : t("chat.saving")}</p> : dirtyCount > 0 && <p className="min-w-0 flex-1 text-[10px] text-warning">{t("chat.pendingWarning")}</p>}
        {sending ? <Button className="ui-danger-button ml-auto px-2" onClick={onStop}>{t("chat.stop")}</Button> : <Button className="ml-auto px-2" onClick={onClear} disabled={disabled || !messages.length}>{t("chat.clear")}</Button>}
      </div>
      <div className="flex flex-wrap gap-1">{commands.map((command) => <Button key={command.name} className="px-2 py-1 text-[10px] text-primary" disabled={dirtyCount > 0 || inputDisabled} title={t(command.descriptionKey)} onClick={() => { onInput(command.name); inputRef.current?.focus(); }}>{command.name}</Button>)}</div>
      <div className="relative">
        <textarea ref={inputRef} aria-label={t("chat.message")} value={input} onChange={(event) => onInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!inputDisabled) onSend(); } }} disabled={inputDisabled} rows={5} placeholder={activeCommand ? t(activeCommand.progressKey) : t("chat.placeholder")} className="ui-input block h-auto resize-none pb-11 pt-2" />
        <div className="absolute bottom-2 left-2 right-2 flex">
          <div className="grid min-w-0 max-w-full">
            <div aria-hidden="true" className="invisible col-start-1 row-start-1 flex min-w-0 items-center gap-1.5 overflow-hidden border border-transparent px-2 text-xs">
              <span className="grid min-w-0">
                {models.length ? models.map((profile) => <span key={profile.model} className="col-start-1 row-start-1 whitespace-nowrap">{profile.model}</span>) : <span className="whitespace-nowrap">{activeModel.model || t("chat.addModel")}</span>}
              </span>
              <span className="w-3 shrink-0" />
            </div>
            <SelectField label={t("chat.selectModel")} selectedKey={activeModel.model} options={models.map((profile) => ({ key: profile.model, label: profile.model, value: profile }))} onChange={onModelChange} placeholder={t("chat.addModel")} disabled={sending || disabled} className="col-start-1 row-start-1 w-full max-w-full px-2 py-1" />
          </div>
        </div>
      </div>
      <Button className="ui-primary-button w-full" onClick={onSend} disabled={inputDisabled || !input.trim()}>{activeCommand ? `${activeCommand.name}…` : sending ? t("chat.sending") : t("chat.send")}</Button>
    </div>
  </>;
}
