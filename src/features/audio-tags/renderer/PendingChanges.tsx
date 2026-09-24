import type { AudioFile } from "../contracts";
import type { TagField } from "./tag-fields";
import { DIFF_STYLES, fieldStatus, getTagValue } from "./tag-fields";
import { Button, PanelHeader, SkeletonLine } from "../../../shared/renderer/controls";
import type { Translate } from "../../../shared/renderer/localization";

export function PendingChanges({ files, selectedId, fieldsForFile, onSelect, onSaveAll, onDiscardAll, progress, disabled, scanning, t }: {
  files: AudioFile[]; selectedId: string; fieldsForFile: (file: AudioFile) => TagField[]; onSelect: (id: string) => void;
  onSaveAll: () => void; onDiscardAll: () => void; progress: { done: number; total: number } | null; disabled: boolean; scanning: boolean; t: Translate;
}) {
  return <>
    <PanelHeader className="bg-background"><span className="ui-field-label">{files.length} {t("changed", "个已修改")}</span></PanelHeader>
    <div className="min-h-0 flex-1 overflow-y-auto py-1">
      {scanning ? <div className="space-y-3 p-3">{Array.from({ length: 5 }, (_, index) => <SkeletonLine key={index} className="h-8 w-full" />)}</div> : files.length === 0 ? <p className="p-3 text-xs italic text-subtle">{t("No pending changes", "没有待保存的修改")}</p> : files.map((file) => <button key={file.id} type="button" disabled={disabled} onClick={() => onSelect(file.id)} className={`w-full px-3 py-2 text-left hover:bg-background ${file.id === selectedId ? "bg-accent" : ""}`}>
        <span className="block truncate text-xs">{file.name}</span><span className="mt-1 block space-y-0.5">{fieldsForFile(file).map((field) => {
          const status = fieldStatus(getTagValue(file.savedTags, field.key), getTagValue(file.tempTags ?? file.savedTags, field.key));
          if (status === "unchanged") return null;
          return <span key={field.key} className="flex items-center gap-1 text-[10px]"><span className={`font-bold ${DIFF_STYLES[status].badge}`}>{DIFF_STYLES[status].label}</span><span className="text-muted-foreground">{field.label}</span></span>;
        })}{file.pendingArtwork && <span className="block text-[10px] text-success-hover">A {t("Generated artwork", "生成图片")} · {file.pendingArtwork.filenames.join(" / ")}</span>}</span>
      </button>)}
    </div>
    <div className="flex shrink-0 gap-2 border-t border-border p-2"><Button className="ui-save-button flex-1 px-2" onClick={onSaveAll} disabled={!files.length || disabled || scanning}>{progress ? `${t("Saving", "保存中")} ${progress.done}/${progress.total}` : t("Accept all", "全部保存")}</Button><Button className="flex-1 px-2" onClick={onDiscardAll} disabled={!files.length || disabled || scanning}>{t("Discard all", "全部放弃")}</Button></div>
  </>;
}
