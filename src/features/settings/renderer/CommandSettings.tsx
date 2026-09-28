import type { ChatCommand } from "../../music-library/command-contracts";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";

interface CommandSettingsProps {
  commands: readonly ChatCommand[];
  disabledCommands: string[];
  onChange: (disabledCommands: string[]) => void;
}

/** Toggle registered commands and persist their availability immediately. */
export function CommandSettings({ commands, disabledCommands, onChange }: CommandSettingsProps) {
  const { t } = useTranslation();
  return <div className="max-w-2xl space-y-3">
    <h2 className="text-sm">{t("settings.commandManagement")}</h2>
    <p className="ui-description">{t("settings.commandDescription")}</p>
    <div className="space-y-2">{commands.map((command) => {
      const enabled = !disabledCommands.includes(command.name);
      return <button key={command.name} type="button" aria-pressed={enabled}
        onClick={() => onChange(enabled ? [...disabledCommands, command.name] : disabledCommands.filter((name) => name !== command.name))}
        className={`w-full rounded border p-3 text-left disabled:opacity-50 ${enabled ? "border-primary bg-accent" : "border-border bg-surface text-muted-foreground"}`}>
        <span className="flex items-center justify-between gap-3 text-xs"><span className="font-mono">{command.name}</span><span>{enabled ? t("common.enabled") : t("common.disabled")}</span></span>
        <span className="mt-1 block text-xs text-muted-foreground">{t(command.descriptionKey)}</span>
      </button>;
    })}</div>
  </div>;
}
