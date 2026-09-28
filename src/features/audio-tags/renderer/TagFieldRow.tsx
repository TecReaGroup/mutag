import { Download, Image as ImageIcon, Trash2, Undo2, Upload } from "lucide-react";
import { AutoTextarea } from "../../../shared/renderer/AutoTextarea";
import { IconButton } from "../../../shared/renderer/controls";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { DIFF_STYLES, fieldStatus } from "./tag-fields";

function CoverPreview({ image, label }: { image: string; label: string }) {
  return <div className="flex min-h-23 items-center"><div className="flex size-20 items-center justify-center overflow-hidden rounded border border-border bg-surface text-subtle">{image ? <img src={image} alt={label} className="size-full object-cover" /> : <ImageIcon size={24} />}</div></div>;
}

/** Keep original and edited values aligned and share field actions across input types. */
export function TagFieldRow({ fieldKey, label, original, edited, required, disabled, onChange, onImport, onExport }: {
  fieldKey: string; label: string; original: string; edited: string; required: boolean; disabled: boolean;
  onChange: (value: string) => void; onImport: () => void; onExport: () => void;
}) {
  const { t } = useTranslation();
  const status = fieldStatus(original, edited);
  const styles = DIFF_STYLES[status];
  const imageField = fieldKey === "image";
  const fieldLabel = <>{label}{required && <span className="ml-1 text-destructive">*</span>}</>;
  return <div className="flex items-start gap-4">
    <div className="min-w-0 flex-1">
      <div className="ui-field-label mb-1 flex min-h-7 items-center gap-1.5"><span>{fieldLabel}</span>{imageField && <IconButton title={t("tags.exportImage")} disabled={disabled || !original} onClick={onExport} className="ml-auto"><Download size={12} /></IconButton>}</div>
      <div className="min-h-9 whitespace-pre-wrap break-words rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{imageField ? <CoverPreview image={original} label={label} /> : original || <span className="italic text-placeholder">{t("common.empty")}</span>}</div>
    </div>
    <div className="min-w-0 flex-1">
      <div className="ui-field-label mb-1 flex min-h-7 items-center gap-1.5"><span>{fieldLabel}</span>{status !== "unchanged" && <span className={`font-bold ${styles.badge}`}>[{styles.label}]</span>}{imageField && <IconButton title={t("tags.importImage")} disabled={disabled} onClick={onImport} className="ml-auto"><Upload size={12} /></IconButton>}</div>
      <div className={`group flex items-start rounded border transition-colors ${styles.field}`}>
        {imageField ? <button type="button" aria-label={t("tags.importImage")} disabled={disabled} onClick={onImport} className="min-w-0 flex-1 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"><CoverPreview image={edited} label={label} /></button> : <AutoTextarea aria-label={t("tags.modifiedField", { label })} value={edited} onChange={(event) => onChange(event.target.value)} placeholder={t("common.empty")} disabled={disabled} className="min-w-0 flex-1" />}
        <div className="flex shrink-0 self-stretch items-center opacity-0 focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
          {status !== "unchanged" && <IconButton title={t("tags.revertField")} disabled={disabled} onClick={() => onChange(original)} className="bg-transparent"><Undo2 size={14} /></IconButton>}
          <IconButton title={imageField ? t("tags.clearImage") : t("tags.clearField")} disabled={disabled} onClick={() => onChange("")} className="bg-transparent"><Trash2 size={14} /></IconButton>
        </div>
      </div>
    </div>
  </div>;
}
