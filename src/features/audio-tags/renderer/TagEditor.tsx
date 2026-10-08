import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import type { AudioFile } from "../contracts";
import type { TagField } from "./tag-fields";
import { getTagValue, hasTagChanges } from "./tag-fields";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { AddChoiceButton } from "../../../shared/renderer/AddChoiceButton";
import { Button, PanelHeader, SkeletonLine } from "../../../shared/renderer/controls";
import { ErrorNotice } from "../../../shared/renderer/ErrorNotice";
import { TagFieldRow } from "./TagFieldRow";

interface TagEditorProps {
  file?: AudioFile; fields: TagField[]; availableFields: TagField[]; defaultKeys: string[];
  scanning: boolean; disabled: boolean; previousAvailable: boolean; nextAvailable: boolean;
  error: string | null; onDismissError: () => void;
  onChange: (key: string, value: string) => void; onAdd: (key: string) => void;
  onSave: () => void; onDiscard: () => void; onPrevious: () => void; onNext: () => void;
  onImport: () => void; onExport: () => void;
}

export function TagEditor({ file, fields, availableFields, defaultKeys, scanning, disabled, previousAvailable, nextAvailable, error, onDismissError, onChange, onAdd, onSave, onDiscard, onPrevious, onNext, onImport, onExport }: TagEditorProps) {
  const { t } = useTranslation();
  return <section aria-label={t("tags.title")} className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
    <PanelHeader><div className="min-w-0 flex-1 truncate">{scanning ? <SkeletonLine className="h-4 w-48" /> : <><span className="text-sm">{file?.name ?? t("tags.noFiles")}</span><span className="ml-2 text-xs text-subtle">{file?.path}</span></>}</div>{file && hasTagChanges(file) && <><span className="text-xs text-warning">● {t("library.unsaved")}</span><Button onClick={onDiscard} disabled={disabled}>{t("common.discard")}</Button></>}</PanelHeader>
    <PanelHeader className="bg-background px-0"><div className="flex-1 border-r border-border px-4 text-xs text-muted-foreground">{t("tags.original")}</div><div className="flex flex-1 justify-between px-4 text-xs text-muted-foreground"><span>{t("tags.modified")}</span><span className="flex gap-3 text-[10px]"><span className="text-warning">■ M</span><span className="text-success-hover">■ A</span><span className="text-destructive">■ D</span></span></div></PanelHeader>
    <div className="min-h-0 flex-1 overflow-y-auto">
      {scanning ? <div className="space-y-3 p-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="flex gap-4"><SkeletonLine className="h-12 flex-1" /><SkeletonLine className="h-12 flex-1" /></div>)}</div> : file ? <div className="space-y-3 p-4">
        {fields.map((field) => <TagFieldRow key={field.key} fieldKey={field.key} label={field.label} original={getTagValue(file.savedTags, field.key)} edited={getTagValue(file.tempTags ?? file.savedTags, field.key)} required={defaultKeys.includes(field.key)} disabled={disabled} onChange={(value) => onChange(field.key, value)} onImport={onImport} onExport={onExport} />)}
        <AddChoiceButton label={t("tags.addField")} choices={availableFields.map((field) => ({ ...field, value: field.key }))} onChoose={onAdd} disabled={disabled} />
      </div> : <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="text-sm text-muted-foreground">{t("tags.noFiles")}</p><p className="mt-1 text-xs text-subtle">{t("tags.chooseFolder")}</p></div></div>}
    </div>
    {error && <div className="absolute bottom-14 left-4 right-4 z-30"><ErrorNotice message={error} onDismiss={onDismissError} /></div>}
    <div className="grid shrink-0 grid-cols-3 items-center border-t border-border p-2">
      <Button className="justify-self-start" onClick={onPrevious} disabled={scanning || disabled || !previousAvailable}><ChevronLeft size={13} />{t("tags.previous")}</Button>
      <Button className="ui-save-button justify-self-center" onClick={onSave} disabled={scanning || disabled || !file || !hasTagChanges(file)}><Save size={13} />{t("common.save")}</Button>
      <Button className="justify-self-end" onClick={onNext} disabled={scanning || disabled || !nextAvailable}>{t("tags.next")}<ChevronRight size={13} /></Button>
    </div>
  </section>;
}
