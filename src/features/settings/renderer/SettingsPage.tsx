import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ModelConfig } from "../contracts";
import { Button, PanelHeader } from "../../../shared/renderer/controls";
import { SelectField } from "../../../shared/renderer/SelectField";
import { LANGUAGE_OPTIONS } from "../../../shared/renderer/localization";
import type { Language, Translate } from "../../../shared/renderer/localization";
import { DefaultFieldSettings } from "./DefaultFieldSettings";
import { ModelSettings } from "./ModelSettings";
import { CommandSettings } from "./CommandSettings";
import type { ChatCommand } from "../../music-library/command-contracts";

interface SettingsPageProps {
  commands: readonly ChatCommand[]; disabledCommands: string[]; onDisabledCommandsChange: (commands: string[]) => void;
  language: Language; onLanguageChange: (language: Language) => void;
  defaultKeys: string[]; onDefaultKeysChange: (keys: string[]) => void;
  models: ModelConfig[]; activeModel: ModelConfig; onModelsChange: (models: ModelConfig[], active: ModelConfig) => void;
  disabled: boolean; onBack: () => void; t: Translate;
}

export function SettingsPage({ commands, disabledCommands, onDisabledCommandsChange, language, onLanguageChange, defaultKeys, onDefaultKeysChange, models, activeModel, onModelsChange, disabled, onBack, t }: SettingsPageProps) {
  const [category, setCategory] = useState("audio-tag");
  const categories = [{ key: "audio-tag", label: t("Audio Tag", "音频标签") }, { key: "openai", label: "LLM" }, { key: "commands", label: t("Commands", "命令管理") }, { key: "language", label: t("Language", "语言") }];
  return <div className="flex h-screen flex-col overflow-hidden border-t border-border bg-background">
    <PanelHeader className="bg-surface"><Button onClick={onBack} disabled={disabled}><ArrowLeft size={14} />{t("Back", "返回")}</Button><span className="ui-field-label">{t("Settings", "设置")}</span></PanelHeader>
    <div className="flex min-h-0 flex-1">
      <nav aria-label={t("Settings", "设置")} className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface py-2">{categories.map((entry) => <button key={entry.key} type="button" aria-current={category === entry.key ? "page" : undefined} disabled={disabled} onClick={() => setCategory(entry.key)} className={`w-full border-l-2 px-4 py-2 text-left text-xs ${category === entry.key ? "border-primary bg-accent" : "border-transparent text-muted-foreground hover:bg-background"}`}>{entry.label}</button>)}</nav>
      <fieldset disabled={disabled} className="min-w-0 flex-1 overflow-y-auto p-6">
        {category === "commands" && <CommandSettings commands={commands} disabledCommands={disabledCommands} onChange={onDisabledCommandsChange} t={t} />}
        {category === "language" && <div className="max-w-2xl space-y-3"><h2 className="text-sm">{t("Language", "语言")}</h2><SelectField label={t("Language", "语言")} selectedKey={language} options={LANGUAGE_OPTIONS} onChange={onLanguageChange} disabled={disabled} className="w-full" /><p className="ui-description">{t("Changes apply immediately and are saved automatically.", "切换后立即生效并自动保存。")}</p></div>}
        {category === "audio-tag" && <DefaultFieldSettings keys={defaultKeys} onChange={onDefaultKeysChange} language={language} t={t} />}
        {category === "openai" && <ModelSettings models={models} activeModel={activeModel} onChange={onModelsChange} t={t} />}
      </fieldset>
    </div>
  </div>;
}
