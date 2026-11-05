import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileVideo, FolderOpen, Save } from "lucide-react";
import type { VideoFile, VideoTags } from "../contracts";
import { TagFieldRow } from "../../audio-tags/renderer/TagFieldRow";
import { DIFF_STYLES, fieldStatus } from "../../audio-tags/renderer/tag-fields";
import { Button, IconButton, PanelHeader, SkeletonLine } from "../../../shared/renderer/controls";
import { ErrorNotice } from "../../../shared/renderer/ErrorNotice";
import { LibrarySelector, type LibraryKind } from "../../../shared/renderer/LibrarySelector";
import { ResizeDivider } from "../../../shared/renderer/ResizeDivider";
import { Tabs } from "../../../shared/renderer/Tabs";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";

const TAG_KEYS = ["image", "title", "creator", "album"] as const;
const isDirty = (file: VideoFile) => TAG_KEYS.some((key) => file.savedTags[key] !== file.draft[key]);

/** Keep video state independent while matching the audio workspace layout. */
export function VideoWorkspace({ onLibraryChange, active, layout, onResizeLeft, onResizeRight }: {
  onLibraryChange: (kind: LibraryKind) => void; active: boolean;
  layout: { leftW: number; rightW: number };
  onResizeLeft: (delta: number) => void; onResizeRight: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = files.findIndex((file) => file.path === selectedPath);
  const selected = files[selectedIndex];
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = files.filter((file) => terms.every((term) => file.name.toLowerCase().includes(term)));
  const dirtyFiles = files.filter(isDirty);
  const disabled = busy || scanning;
  const previousAvailable = selectedIndex > 0;
  const nextAvailable = selectedIndex >= 0 && selectedIndex < files.length - 1;
  const fields = TAG_KEYS.map((key) => ({ key, label: t(key === "image" ? "video.cover" : key === "title" ? "video.titleField" : `video.${key}`) }));

  useEffect(() => { if (active) selectedRef.current?.scrollIntoView({ block: "nearest" }); }, [selectedPath, active]);
  useEffect(() => {
    if (!active || disabled) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button, [role="listbox"], [role="separator"]'))) return;
      if ((event.key === "ArrowUp" || event.key === "ArrowLeft") && previousAvailable) { event.preventDefault(); setSelectedPath(files[selectedIndex - 1].path); }
      if ((event.key === "ArrowDown" || event.key === "ArrowRight") && nextAvailable) { event.preventDefault(); setSelectedPath(files[selectedIndex + 1].path); }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [active, disabled, files, selectedIndex, previousAvailable, nextAvailable]);

  function changeField(key: keyof VideoTags, value: string) {
    setFiles((previous) => previous.map((file) => file.path === selectedPath ? { ...file, draft: { ...file.draft, [key]: value } } : file));
  }

  async function openFolder() {
    if (dirtyFiles.length && !window.confirm(t("video.replaceDrafts"))) return;
    setScanning(true); setError(null);
    try {
      if (!window.videoTagApi) throw new Error(t("video.desktopRequired"));
      const opened = await window.videoTagApi.openFolder();
      if (!opened.ok) { if (!opened.canceled) setError(opened.error ?? t("video.failed")); return; }
      setFiles(opened.files); setSelectedPath(opened.files[0]?.path ?? ""); setQuery("");
      if (opened.warnings.length) setError(opened.warnings.join("\n"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
    finally { setScanning(false); }
  }

  /** Save each draft independently, retaining failed edits for retry. */
  async function saveFiles(pendingFiles: VideoFile[]) {
    setBusy(true); setError(null);
    setProgress({ done: 0, total: pendingFiles.length });
    const failures: string[] = [];
    try {
      if (!window.videoTagApi) throw new Error(t("video.desktopRequired"));
      const api = window.videoTagApi;
      for (const [index, pending] of pendingFiles.entries()) {
        try {
          const saved = await api.saveTags(pending.path, pending.draft);
          if (!saved.ok) throw new Error(saved.error ?? t("video.failed"));
          setFiles((previous) => previous.map((file) => file.path === pending.path ? { ...file, savedTags: saved.tags, draft: { ...saved.tags } } : file));
        } catch (failure) { failures.push(`${pending.name}: ${failure instanceof Error ? failure.message : String(failure)}`); }
        setProgress({ done: index + 1, total: pendingFiles.length });
      }
      if (failures.length) setError(failures.join("\n"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
    finally { setBusy(false); setProgress(null); }
  }

  async function importImage() {
    setBusy(true); setError(null);
    try {
      if (!window.videoTagApi) throw new Error(t("video.desktopRequired"));
      const imported = await window.videoTagApi.importImage();
      if (imported.ok) changeField("image", imported.image);
      else if (!imported.canceled) setError(imported.error ?? t("video.failed"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
    finally { setBusy(false); }
  }

  async function exportImage() {
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      if (!window.videoTagApi) throw new Error(t("video.desktopRequired"));
      const exported = await window.videoTagApi.exportImage(selected.path);
      if (!exported.ok && !exported.canceled) setError(exported.error ?? t("video.failed"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
    finally { setBusy(false); }
  }

  return <main className="ui-page-enter flex h-screen w-full overflow-hidden border-t border-border bg-background">
    <aside className="relative flex shrink-0 flex-col bg-surface" style={{ width: layout.leftW }}>
      <PanelHeader><span className="ui-field-label">{t("video.title")}</span><LibrarySelector selected="video" onChange={onLibraryChange} disabled={disabled} /><IconButton title={t("library.openFolder")} onClick={() => void openFolder()} disabled={disabled} className="ml-auto"><FolderOpen size={14} /></IconButton></PanelHeader>
      <PanelHeader className="bg-background"><span className="shrink-0 text-[10px] text-subtle">{scanning ? t("library.scanning") : query.trim() ? t("library.filteredCount", { count: visible.length, total: files.length }) : t("library.itemCount", { count: visible.length })}</span><input className="ui-input min-w-0 flex-1" aria-label={t("video.search")} placeholder={t("library.search")} value={query} onChange={(event) => setQuery(event.target.value)} disabled={disabled} /></PanelHeader>
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-1">
        {scanning ? <div className="space-y-3 p-3">{Array.from({ length: 8 }, (_, index) => <div key={index} className="space-y-2"><SkeletonLine className="h-3 w-4/5" /><SkeletonLine className="h-2 w-10" /></div>)}</div> : visible.map((file) => <button type="button" key={file.path} ref={file.path === selectedPath ? selectedRef : undefined} title={file.path} disabled={disabled} aria-current={selectedPath === file.path ? "true" : undefined} onClick={() => setSelectedPath(file.path)} className={`ui-nav-item flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selectedPath === file.path ? "border-primary bg-accent" : "border-transparent hover:bg-background"}`}><FileVideo size={13} className="mt-0.5 shrink-0 text-subtle" /><span className="min-w-0 flex-1"><span className="block truncate text-xs">{file.name}</span><span className="mt-0.5 block text-[10px] text-subtle">{file.name.split(".").pop()?.toUpperCase() ?? "?"}</span></span>{isDirty(file) && <span className="text-[10px] text-warning" aria-label={t("library.unsaved")}>●</span>}</button>)}
        {!scanning && !visible.length && <p className="p-3 text-xs text-subtle">{t("library.noMatches")}</p>}
      </div>
    </aside>
    <ResizeDivider label={t("workspace.resizeFiles")} onDrag={onResizeLeft} />
    <section aria-label={t("video.tags")} className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
      <PanelHeader><div className="min-w-0 flex-1 truncate">{scanning ? <SkeletonLine className="h-4 w-48" /> : <><span className="text-sm">{selected?.name ?? t("video.noFiles")}</span><span className="ml-2 text-xs text-subtle">{selected?.path}</span></>}</div>{selected && isDirty(selected) && <><span className="text-xs text-warning">● {t("library.unsaved")}</span><Button disabled={disabled} onClick={() => setFiles((previous) => previous.map((file) => file.path === selectedPath ? { ...file, draft: { ...file.savedTags } } : file))}>{t("common.discard")}</Button></>}</PanelHeader>
      <PanelHeader className="bg-background px-0"><div className="flex-1 border-r border-border px-4 text-xs text-muted-foreground">{t("tags.original")}</div><div className="flex flex-1 justify-between px-4 text-xs text-muted-foreground"><span>{t("tags.modified")}</span><span className="flex gap-3 text-[10px]"><span className="text-warning">● M</span><span className="text-success-hover">● A</span><span className="text-destructive">● D</span></span></div></PanelHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {scanning ? <div className="space-y-3 p-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="flex gap-4"><SkeletonLine className="h-12 flex-1" /><SkeletonLine className="h-12 flex-1" /></div>)}</div> : selected ? <div className="space-y-3 p-4">{fields.map((field) => <TagFieldRow key={field.key} fieldKey={field.key} label={field.label} original={selected.savedTags[field.key]} edited={selected.draft[field.key]} required disabled={disabled} onChange={(value) => changeField(field.key, value)} onImport={() => void importImage()} onExport={() => void exportImage()} />)}</div> : <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="text-sm text-muted-foreground">{t("video.noFiles")}</p><p className="mt-1 text-xs text-subtle">{t("video.chooseFolder")}</p></div></div>}
      </div>
      {error && <div className="absolute bottom-14 left-4 right-4 z-30"><ErrorNotice message={error} onDismiss={() => setError(null)} /></div>}
      <div className="grid shrink-0 grid-cols-3 items-center border-t border-border p-2">
        <Button className="justify-self-start" onClick={() => setSelectedPath(files[selectedIndex - 1].path)} disabled={disabled || !previousAvailable}><ChevronLeft size={13} />{t("tags.previous")}</Button>
        <Button className="ui-save-button justify-self-center" onClick={() => selected && void saveFiles([selected])} disabled={disabled || !selected || !isDirty(selected)}><Save size={13} />{t("common.save")}</Button>
        <Button className="justify-self-end" onClick={() => setSelectedPath(files[selectedIndex + 1].path)} disabled={disabled || !nextAvailable}>{t("tags.next")}<ChevronRight size={13} /></Button>
      </div>
    </section>
    <ResizeDivider label={t("workspace.resizeActivity")} onDrag={onResizeRight} />
    <aside className="flex shrink-0 flex-col bg-surface" style={{ width: layout.rightW }}>
      <Tabs label={t("workspace.activity")} tabs={[{ key: "pending", label: t("workspace.pending") }]} selectedKey="pending" onChange={() => {}} disabled={disabled}>
        <PanelHeader className="bg-background"><span className="ui-field-label">{t("pending.count", { count: dirtyFiles.length })}</span></PanelHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {scanning ? <div className="space-y-3 p-3">{Array.from({ length: 5 }, (_, index) => <SkeletonLine key={index} className="h-8 w-full" />)}</div> : !dirtyFiles.length ? <p className="p-3 text-xs italic text-subtle">{t("pending.empty")}</p> : dirtyFiles.map((file) => <button key={file.path} type="button" disabled={disabled} onClick={() => setSelectedPath(file.path)} className={`w-full px-3 py-2 text-left hover:bg-background ${file.path === selectedPath ? "bg-accent" : ""}`}><span className="block truncate text-xs">{file.name}</span><span className="mt-1 block space-y-0.5">{fields.map((field) => {
            const status = fieldStatus(file.savedTags[field.key], file.draft[field.key]);
            if (status === "unchanged") return null;
            return <span key={field.key} className="flex items-center gap-1 text-[10px]"><span className={`font-bold ${DIFF_STYLES[status].badge}`}>{DIFF_STYLES[status].label}</span><span className="text-muted-foreground">{field.label}</span></span>;
          })}</span></button>)}
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border p-2"><Button className="ui-save-button flex-1 px-2" onClick={() => void saveFiles(dirtyFiles)} disabled={!dirtyFiles.length || disabled}>{progress ? t("pending.saving", progress) : t("pending.saveAll")}</Button><Button className="flex-1 px-2" onClick={() => setFiles((previous) => previous.map((file) => ({ ...file, draft: { ...file.savedTags } })))} disabled={!dirtyFiles.length || disabled}>{t("pending.discardAll")}</Button></div>
      </Tabs>
    </aside>
  </main>;
}
