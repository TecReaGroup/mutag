import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ModelConfig } from "../contracts";
import { Button, PanelHeader } from "../../../shared/renderer/controls";
import { SelectField } from "../../../shared/renderer/SelectField";
import { LANGUAGE_OPTIONS } from "../../../shared/localization";
import type { Language } from "../../../shared/localization";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { DefaultFieldSettings } from "./DefaultFieldSettings";
import { ModelSettings } from "./ModelSettings";
import { CommandSettings } from "./CommandSettings";
import type { ChatCommand } from "../../music-library/command-contracts";

interface SettingsPageProps {
  commands: readonly ChatCommand[]; disabledCommands: string[]; onDisabledCommandsChange: (commands: string[]) => void;
  onLanguageChange: (language: Language) => void;
  defaultKeys: string[]; onDefaultKeysChange: (keys: string[]) => void;
  models: ModelConfig[]; activeModel: ModelConfig; onModelsChange: (models: ModelConfig[], active: ModelConfig) => void;
  disabled: boolean; onBack: () => void;
}

export function SettingsPage({ commands, disabledCommands, onDisabledCommandsChange, onLanguageChange, defaultKeys, onDefaultKeysChange, models, activeModel, onModelsChange, disabled, onBack }: SettingsPageProps) {
  const { language, t } = useTranslation();
  const [category, setCategory] = useState("audio-tag");
  const categories = [{ key: "audio-tag", label: t("settings.audioTags") }, { key: "openai", label: "LLM" }, { key: "commands", label: t("settings.commands") }, { key: "language", label: t("settings.language") }];
  return <div className="ui-page-enter flex h-screen flex-col overflow-hidden border-t border-border bg-background">
    <PanelHeader className="bg-surface"><Button onClick={onBack} disabled={disabled}><ArrowLeft size={14} />{t("common.back")}</Button><span className="ui-field-label">{t("common.settings")}</span></PanelHeader>
    <div className="flex min-h-0 flex-1">
      <nav aria-label={t("common.settings")} className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface py-2">{categories.map((entry) => <button key={entry.key} type="button" aria-current={category === entry.key ? "page" : undefined} disabled={disabled} onClick={() => setCategory(entry.key)} className={`ui-nav-item w-full border-l-2 px-4 py-2 text-left text-xs ${category === entry.key ? "border-primary bg-accent" : "border-transparent text-muted-foreground hover:bg-background"}`}>{entry.label}</button>)}</nav>
      <fieldset disabled={disabled} className="ui-content-enter min-w-0 flex-1 overflow-y-auto p-6">
        {category === "commands" && <CommandSettings commands={commands} disabledCommands={disabledCommands} onChange={onDisabledCommandsChange} />}
        {category === "language" && <div className="max-w-2xl space-y-3"><h2 className="text-sm">{t("settings.language")}</h2><SelectField label={t("settings.language")} selectedKey={language} options={LANGUAGE_OPTIONS} onChange={onLanguageChange} disabled={disabled} className="w-full" /><p className="ui-description">{t("settings.autoSave")}</p></div>}
        {category === "audio-tag" && <DefaultFieldSettings keys={defaultKeys} onChange={onDefaultKeysChange} />}
        {category === "openai" && <ModelSettings models={models} activeModel={activeModel} onChange={onModelsChange} />}
      </fieldset>
    </div>
  </div>;
}
