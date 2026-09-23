import { Plus } from "lucide-react";
import { ChoiceMenu } from "./ChoiceMenu";
import type { Choice } from "./ChoiceMenu";

/** Choose an item to add without retaining a selected value. */
export function AddChoiceButton<Value>({ label, choices, onChoose, disabled }: { label: string; choices: readonly Choice<Value>[]; onChoose: (value: Value) => void; disabled?: boolean }) {
  return <ChoiceMenu label={label} choices={choices} onChoose={onChoose} disabled={disabled} className="ui-add-button" trigger={<><Plus size={14} />{label}</>} />;
}
