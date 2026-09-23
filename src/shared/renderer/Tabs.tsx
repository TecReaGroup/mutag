import { useId, useRef } from "react";
import type { ReactNode } from "react";

interface Tab<Key extends string> { key: Key; label: string }

/** Keep tab selection, roving focus and panel labelling consistent. */
export function Tabs<Key extends string>({ label, tabs, selectedKey, onChange, disabled, children }: {
  label: string; tabs: readonly Tab<Key>[]; selectedKey: Key; onChange: (key: Key) => void; disabled?: boolean; children: ReactNode;
}) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <>
    <div className="flex h-10 shrink-0 border-b border-border" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => <button key={tab.key} ref={(element) => { buttons.current[index] = element; }} id={`${id}-${tab.key}`} type="button" role="tab" aria-selected={selectedKey === tab.key} aria-controls={`${id}-panel`} tabIndex={selectedKey === tab.key ? 0 : -1} disabled={disabled}
        onClick={() => onChange(tab.key)}
        onKeyDown={(event) => {
          let next: number;
          switch (event.key) {
            case "ArrowLeft": next = (index - 1 + tabs.length) % tabs.length; break;
            case "ArrowRight": next = (index + 1) % tabs.length; break;
            case "Home": next = 0; break;
            case "End": next = tabs.length - 1; break;
            default: return;
          }
          event.preventDefault(); event.stopPropagation(); onChange(tabs[next].key); buttons.current[next]?.focus();
        }}
        className={`flex-1 text-xs uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selectedKey === tab.key ? "-mb-px border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>)}
    </div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${selectedKey}`} className="flex min-h-0 flex-1 flex-col">{children}</div>
  </>;
}
