import type { ChatCommand } from "../../music-library/command-contracts";
import type { Translate } from "../../../shared/renderer/localization";

interface CommandSettingsProps {
  commands: readonly ChatCommand[];
  disabledCommands: string[];
  onChange: (disabledCommands: string[]) => void;
  t: Translate;
}

/** Toggle registered commands and persist their availability immediately. */
export function CommandSettings({ commands, disabledCommands, onChange, t }: CommandSettingsProps) {
  return <div className="max-w-2xl space-y-3">
    <h2 className="text-sm">{t("Command management", "命令管理")}</h2>
    <p className="ui-description">{t("Click a command to enable or disable it. Changes are saved automatically.", "点击命令启用，再次点击取消启用，修改自动保存。")}</p>
    <div className="space-y-2">{commands.map((command) => {
      const enabled = !disabledCommands.includes(command.name);
      return <button key={command.name} type="button" aria-pressed={enabled}
        onClick={() => onChange(enabled ? [...disabledCommands, command.name] : disabledCommands.filter((name) => name !== command.name))}
        className={`w-full rounded border p-3 text-left disabled:opacity-50 ${enabled ? "border-primary bg-accent" : "border-border bg-surface text-muted-foreground"}`}>
        <span className="flex items-center justify-between gap-3 text-xs"><span className="font-mono">{command.name}</span><span>{enabled ? t("Enabled", "已启用") : t("Disabled", "未启用")}</span></span>
        <span className="mt-1 block text-xs text-muted-foreground">{t(command.descriptionEn, command.description)}</span>
      </button>;
    })}</div>
  </div>;
}
