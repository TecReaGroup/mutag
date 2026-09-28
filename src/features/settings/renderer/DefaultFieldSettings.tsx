import { useRef, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { IconButton } from "../../../shared/renderer/controls";
import { AddChoiceButton } from "../../../shared/renderer/AddChoiceButton";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { knownTagFields, tagLabel } from "../../audio-tags/renderer/tag-fields";

/** Own field ordering interactions for the default-field preference. */
export function DefaultFieldSettings({ keys, onChange }: { keys: string[]; onChange: (keys: string[]) => void }) {
  const { t } = useTranslation();
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const reorder = (from: number, to: number) => {
    const reordered = [...keys];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onChange(reordered);
  };
  return <div className="max-w-2xl space-y-4">
    <div><h2 className="text-sm">{t("settings.defaultFields")}</h2><p className="ui-description mt-1">{t("settings.defaultFieldsDescription")}</p></div>
    <div className="space-y-2">{keys.map((key, index) => <div key={key} draggable
      onDragStart={() => { dragFrom.current = index; }}
      onDragOver={(event) => { event.preventDefault(); setDragOver(index); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(event) => { event.preventDefault(); if (dragFrom.current !== null) reorder(dragFrom.current, index); dragFrom.current = null; setDragOver(null); }}
      onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
      className={`flex items-center gap-2 rounded border bg-surface px-3 py-2 ${dragOver === index ? "border-primary" : "border-border"}`}>
      <GripVertical size={14} className="cursor-grab text-subtle" /><span className="w-6 text-[10px] text-subtle">{index + 1}</span><span className="flex-1 text-sm">{tagLabel(key, t)}</span>
      <IconButton title={t("settings.removeDefault")} onClick={() => onChange(keys.filter((entry) => entry !== key))}><Trash2 size={14} /></IconButton>
    </div>)}</div>
    <AddChoiceButton label={t("settings.addDefault")} choices={knownTagFields(t).filter((field) => !keys.includes(field.key)).map((field) => ({ ...field, value: field.key }))} onChoose={(key) => onChange([...keys, key])} />
  </div>;
}
