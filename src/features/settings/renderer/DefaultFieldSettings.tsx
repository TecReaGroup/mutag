import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { IconButton } from "../../../shared/renderer/controls";
import { AddChoiceButton } from "../../../shared/renderer/AddChoiceButton";
import type { Language, Translate } from "../../../shared/renderer/localization";
import { knownTagFields, tagLabel } from "../../audio-tags/renderer/tag-fields";

/** Own field ordering interactions for the default-field preference. */
export function DefaultFieldSettings({ keys, onChange, language, t }: { keys: string[]; onChange: (keys: string[]) => void; language: Language; t: Translate }) {
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const reorder = (from: number, to: number) => {
    const reordered = [...keys];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onChange(reordered);
  };
  return <div className="max-w-2xl space-y-4">
    <div><h2 className="text-sm">{t("Default Fields", "默认字段")}</h2><p className="ui-description mt-1">{t("Default fields always appear in this order, even when empty. Other fields appear after them only while they have content; clearing an other field removes it on save.", "默认字段始终按此顺序显示，即使为空。其他字段仅在有内容时显示，清空后将在保存时移除。")}</p></div>
    <div className="space-y-2">{keys.map((key, index) => <div key={key} draggable
      onDragStart={() => { dragFrom.current = index; }}
      onDragOver={(event) => { event.preventDefault(); setDragOver(index); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(event) => { event.preventDefault(); if (dragFrom.current !== null) reorder(dragFrom.current, index); dragFrom.current = null; setDragOver(null); }}
      onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
      className={`flex items-center gap-2 rounded border bg-surface px-3 py-2 ${dragOver === index ? "border-primary" : "border-border"}`}>
      <GripVertical size={14} className="cursor-grab text-subtle" /><span className="w-6 text-[10px] text-subtle">{index + 1}</span><span className="flex-1 text-sm">{tagLabel(key, language)}</span>
      <IconButton title={t("Move up", "上移")} disabled={index === 0} onClick={() => reorder(index, index - 1)}><ChevronUp size={14} /></IconButton>
      <IconButton title={t("Move down", "下移")} disabled={index === keys.length - 1} onClick={() => reorder(index, index + 1)}><ChevronDown size={14} /></IconButton>
      <IconButton title={t("Remove from defaults", "从默认字段移除")} onClick={() => onChange(keys.filter((entry) => entry !== key))}><Trash2 size={14} /></IconButton>
    </div>)}</div>
    <AddChoiceButton label={t("Add default field", "添加默认字段")} choices={knownTagFields(language).filter((field) => !keys.includes(field.key)).map((field) => ({ ...field, value: field.key }))} onChoose={(key) => onChange([...keys, key])} />
  </div>;
}
