import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { AudioFile } from "../../features/audio-tags/contracts";
import { TagEditor } from "../../features/audio-tags/renderer/TagEditor";
import { PendingChanges } from "../../features/audio-tags/renderer/PendingChanges";
import { fieldsForFile, hasTagChanges, knownTagFields } from "../../features/audio-tags/renderer/tag-fields";
import { useTagEditing } from "../../features/audio-tags/renderer/use-tag-editing";
import { ChatPanel } from "../../features/chat/renderer/ChatPanel";
import { useConversation } from "../../features/chat/renderer/use-conversation";
import { AudioFileList } from "../../features/music-library/renderer/AudioFileList";
import { DEMO_FILES } from "../../features/music-library/renderer/demo-files";
import { useLibrarySession } from "../../features/music-library/renderer/use-library-session";
import { useFileNavigation } from "../../features/music-library/renderer/use-file-navigation";
import { useProjectPersistence } from "../../features/music-library/renderer/use-project-persistence";
import { SettingsPage } from "../../features/settings/renderer/SettingsPage";
import { usePreferences } from "../../features/settings/renderer/use-preferences";
import { IconButton } from "../../shared/renderer/controls";
import { ErrorNotice } from "../../shared/renderer/ErrorNotice";
import { ResizeDivider } from "../../shared/renderer/ResizeDivider";
import { Tabs } from "../../shared/renderer/Tabs";
import { CHAT_COMMANDS, resolveChatCommand } from "./chat-commands";

const INITIAL_FILES = import.meta.env.DEV ? DEMO_FILES : [];

/** Compose feature-owned state and panels into the desktop workspace. */
export function MusicWorkspace() {
  const [showSettings, setShowSettings] = useState(false);
  const [rightTab, setRightTab] = useState("pending");
  const preferences = usePreferences();
  const { config } = preferences;
  const language = config.language ?? "en";
  const t = (english: string, chinese: string) => language === "zh-CN" ? chinese : english;
  const session = useLibrarySession(INITIAL_FILES, preferences.loaded, preferences.initialFolder, preferences.setLastFolder);
  const disabledCommands = config.disabledCommands ?? [];
  const enabledCommands = CHAT_COMMANDS.filter((command) => !disabledCommands.includes(command.name));
  const conversation = useConversation(session, config.openAI, (text) => resolveChatCommand(text, disabledCommands, t), () => persistence.flush());
  const editing = useTagEditing(session, session.scanning || conversation.activeCommand !== null);
  const fileOperationBusy = editing.progress !== null || conversation.activeCommand !== null;
  const projectState = useMemo(() => ({
    selectedId: session.selectedId,
    files: Object.fromEntries(session.files.map((file) => [file.id, { tempTags: file.tempTags, pendingArtwork: file.pendingArtwork }])),
    chatMessages: session.messages,
  }), [session.selectedId, session.files, session.messages]);
  const persistence = useProjectPersistence(session.root, projectState, preferences.loaded && !session.scanning && !conversation.activeCommand);
  const navigation = useFileNavigation(session.files, session.selectedId, session.setSelectedId, fileOperationBusy || session.scanning || showSettings);
  const selectedFile = session.files.find((file) => file.id === session.selectedId);
  const defaultKeys = config.audioTag.defaultFieldKeys;
  const describeFields = (file: AudioFile) => fieldsForFile(file, defaultKeys, editing.extraKeys, language);
  const selectedFields = selectedFile ? describeFields(selectedFile) : [];
  const availableFields = knownTagFields(language).filter((field) => !selectedFields.some((selected) => selected.key === field.key));
  const dirtyFiles = session.files.filter(hasTagChanges);

  if (showSettings) return <SettingsPage commands={CHAT_COMMANDS} disabledCommands={disabledCommands} onDisabledCommandsChange={preferences.setDisabledCommands} language={language} onLanguageChange={preferences.setLanguage} defaultKeys={defaultKeys} onDefaultKeysChange={preferences.setDefaultKeys} models={config.models ?? []} activeModel={config.openAI} onModelsChange={preferences.setModels} disabled={fileOperationBusy} onBack={() => setShowSettings(false)} t={t} />;

  return <main className="ui-page-enter flex h-screen w-full overflow-hidden border-t border-border bg-background">
    <aside className="relative flex shrink-0 flex-col bg-surface" style={{ width: config.layout.leftW }}>
      <AudioFileList files={session.files} selectedId={session.selectedId} onSelect={session.setSelectedId} onOpenFolder={() => { if (!fileOperationBusy && !conversation.sending) void session.openFolder(persistence.flush); }} scanning={session.scanning} disabled={fileOperationBusy || conversation.sending} t={t} />
      <IconButton title={t("Settings", "设置")} onClick={() => setShowSettings(true)} disabled={fileOperationBusy} className="absolute bottom-3 left-3 rounded-full border-border shadow-sm"><Settings size={14} /></IconButton>
    </aside>
    <ResizeDivider label={t("Resize file panel", "调整文件面板宽度")} onDrag={preferences.resizeLeft} />
    <TagEditor file={selectedFile} fields={selectedFields} availableFields={availableFields} defaultKeys={defaultKeys} scanning={session.scanning} disabled={fileOperationBusy} previousAvailable={navigation.previousAvailable} nextAvailable={navigation.nextAvailable} error={editing.error} onDismissError={editing.dismissError} onChange={editing.updateField} onAdd={editing.addField} onSave={editing.saveSelected} onDiscard={editing.discardSelected} onPrevious={navigation.previous} onNext={navigation.next} onImport={editing.importImage} onExport={editing.exportImage} t={t} />
    <ResizeDivider label={t("Resize activity panel", "调整活动面板宽度")} onDrag={preferences.resizeRight} />
    <aside className="flex shrink-0 flex-col bg-surface" style={{ width: config.layout.rightW }}>
      <Tabs label={t("Activity", "活动")} tabs={[{ key: "pending", label: t("Pending", "待保存") }, { key: "chat", label: t("Chat", "对话") }]} selectedKey={rightTab} onChange={setRightTab} disabled={fileOperationBusy}>
        {rightTab === "pending" ? <PendingChanges files={dirtyFiles} selectedId={session.selectedId} fieldsForFile={describeFields} onSelect={session.setSelectedId} onSaveAll={editing.saveAll} onDiscardAll={editing.discardAll} progress={editing.progress} disabled={fileOperationBusy} scanning={session.scanning} t={t} /> : <ChatPanel messages={session.messages} input={conversation.input} onInput={conversation.setInput} sending={conversation.sending} activeCommand={conversation.activeCommand} error={conversation.error} onSend={() => { if (!fileOperationBusy && !session.scanning) void conversation.send(); }} onStop={conversation.stop} onClear={conversation.clear} models={config.models ?? []} activeModel={config.openAI} onModelChange={preferences.selectModel} commands={enabledCommands} fileCount={session.files.length} dirtyCount={dirtyFiles.length} disabled={fileOperationBusy} scanning={session.scanning} t={t} />}
      </Tabs>
    </aside>
    {(preferences.error || session.error || persistence.error) && <div className="fixed bottom-16 left-4 right-4 z-30"><ErrorNotice message={preferences.error ?? session.error ?? persistence.error!} /></div>}
  </main>;
}
