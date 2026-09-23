import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ChoiceMenu } from "./ChoiceMenu";
import type { Choice } from "./ChoiceMenu";

/** Display a selected value using the shared choice-menu interaction. */
export function SelectField<Value>({ label, selectedKey, options, onChange, placeholder, disabled, className = "", style, menuWidth, menuMaxHeight }: {
  label: string; selectedKey: string; options: readonly Choice<Value>[]; onChange: (value: Value) => void;
  placeholder?: string; disabled?: boolean; className?: string;
  style?: CSSProperties; menuWidth?: number; menuMaxHeight?: number;
}) {
  const selected = options.find((option) => option.key === selectedKey);
  return <ChoiceMenu label={label} selectedKey={selectedKey} choices={options} onChoose={onChange} disabled={disabled}
    style={style} menuWidth={menuWidth} menuMaxHeight={menuMaxHeight}
    className={`min-w-0 justify-between ${className}`}
    trigger={<><span className="truncate">{selected?.label ?? (selectedKey || placeholder)}</span><ChevronRight size={12} className="ui-select-chevron shrink-0" /></>} />;
}
