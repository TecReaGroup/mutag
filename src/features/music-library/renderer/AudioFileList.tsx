import { useEffect, useRef, useState } from "react";
import { FileAudio, FolderOpen } from "lucide-react";
import type { AudioFile } from "../../audio-tags/contracts";
import { hasTagChanges } from "../../audio-tags/renderer/tag-fields";
import { IconButton, PanelHeader, SkeletonLine } from "../../../shared/renderer/controls";
import type { Translate } from "../../../shared/renderer/localization";

export function AudioFileList({ files, selectedId, onSelect, onOpenFolder, scanning, disabled, t }: {
  files: AudioFile[]; selectedId: string; onSelect: (id: string) => void; onOpenFolder: () => void;
  scanning: boolean; disabled: boolean; t: Translate;
}) {
  const [query, setQuery] = useState("");
  const selectedRef = useRef<HTMLButtonElement>(null);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visibleFiles = files.filter((file) => terms.every((term) => file.name.toLowerCase().includes(term)));
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: "nearest" }); }, [selectedId]);
  return <>
    <PanelHeader><span className="ui-field-label">{t("Audio Files", "音频文件")}</span><IconButton title={t("Open folder", "打开文件夹")} onClick={onOpenFolder} disabled={scanning || disabled} className="ml-auto"><FolderOpen size={14} /></IconButton></PanelHeader>
    <PanelHeader className="bg-background"><span className="shrink-0 text-[10px] text-subtle">{scanning ? t("scanning...", "扫描中…") : `${visibleFiles.length}${query.trim() ? `/${files.length}` : ""} ${t("items", "项")}`}</span><input aria-label={t("Search audio files", "搜索音频文件")} className="ui-input min-w-0 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} disabled={scanning || disabled} placeholder={t("Search", "搜索")} /></PanelHeader>
    <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-1">
      {scanning ? <div className="space-y-3 p-3">{Array.from({ length: 8 }, (_, index) => <div key={index} className="space-y-2"><SkeletonLine className="h-3 w-4/5" /><SkeletonLine className="h-2 w-10" /></div>)}</div> : visibleFiles.map((file) => <button
        key={file.id} ref={file.id === selectedId ? selectedRef : undefined} type="button" aria-current={file.id === selectedId ? "true" : undefined} disabled={disabled} onClick={() => onSelect(file.id)}
        className={`ui-nav-item flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${file.id === selectedId ? "border-primary bg-accent" : "border-transparent hover:bg-background"}`}>
        <FileAudio size={13} className="mt-0.5 shrink-0 text-subtle" /><span className="min-w-0 flex-1"><span className="block truncate text-xs">{file.name}</span><span className="mt-0.5 block text-[10px] text-subtle">{file.name.split(".").pop()?.toUpperCase() ?? "?"}</span></span>{hasTagChanges(file) && <span aria-label={t("Unsaved changes", "未保存修改")} className="text-[10px] text-warning">●</span>}
      </button>)}
      {!scanning && !visibleFiles.length && <p className="p-3 text-xs text-subtle">{t("No matching files", "没有匹配的文件")}</p>}
    </div>
  </>;
}
