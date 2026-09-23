import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./controls";

export interface Choice<Value> { key: string; label: string; value: Value }

interface ChoiceMenuProps<Value> {
  label: string;
  trigger: ReactNode;
  choices: readonly Choice<Value>[];
  selectedKey?: string;
  onChoose: (value: Value) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  menuWidth?: number;
  menuMaxHeight?: number;
}

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;
const MAX_MENU_HEIGHT = 224;

/** Own popup placement, dismissal and keyboard focus for choice controls. */
export function ChoiceMenu<Value>({ label, trigger, choices, selectedKey, onChoose, disabled, className = "", style, menuWidth, menuMaxHeight = MAX_MENU_HEIGHT }: ChoiceMenuProps<Value>) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: MAX_MENU_HEIGHT });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const unavailable = disabled || choices.length === 0;
  const expanded = open && !unavailable;

  useEffect(() => { if (unavailable) setOpen(false); }, [unavailable]);

  useLayoutEffect(() => {
    if (!expanded) return;
    const placeMenu = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const menu = menuRef.current!;
      const width = Math.max(0, Math.min(menuWidth ?? triggerRect.width, window.innerWidth - VIEWPORT_MARGIN * 2));
      // Measure wrapped content at its final width before choosing placement.
      menu.style.width = `${width}px`;
      menu.style.maxHeight = "none";
      const menuHeight = menu.getBoundingClientRect().height;
      const below = window.innerHeight - triggerRect.bottom - MENU_GAP - VIEWPORT_MARGIN;
      const above = triggerRect.top - MENU_GAP - VIEWPORT_MARGIN;
      const upward = below < Math.min(menuHeight, menuMaxHeight) && above > below;
      const maxHeight = Math.max(0, Math.min(menuMaxHeight, upward ? above : below));
      menu.style.maxHeight = `${maxHeight}px`;
      setPlacement(upward ? "top" : "bottom");
      setPosition({ left: Math.max(VIEWPORT_MARGIN, Math.min(triggerRect.left, window.innerWidth - width - VIEWPORT_MARGIN)), top: upward ? triggerRect.top - Math.min(menuHeight, maxHeight) - MENU_GAP : triggerRect.bottom + MENU_GAP, width, maxHeight });
    };
    placeMenu();
    const dismissOutside = (event: Event) => {
      const target = event.target as Node;
      if (!triggerRef.current!.contains(target) && !menuRef.current!.contains(target)) setOpen(false);
    };
    const reposition = (event: Event) => { if (!menuRef.current!.contains(event.target as Node)) placeMenu(); };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [expanded, menuWidth, menuMaxHeight, choices, selectedKey]);

  useLayoutEffect(() => {
    if (!expanded) return;
    const menu = menuRef.current!;
    const selected = menu.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? menu.querySelector<HTMLButtonElement>("button");
    selected?.focus({ preventScroll: true });
    if (selected) menu.scrollTop = Math.max(0, selected.offsetTop - menu.clientHeight + selected.offsetHeight);
  }, [expanded]);

  return <>
    <Button ref={triggerRef} aria-label={label} aria-haspopup="listbox" aria-expanded={expanded} aria-controls={expanded ? menuId : undefined} data-placement={placement} disabled={unavailable} className={className} style={style}
      onClick={() => setOpen((previous) => !previous)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); event.stopPropagation(); setOpen(true); }
      }}>{trigger}</Button>
    {expanded && createPortal(
      <div ref={menuRef} id={menuId} role="listbox" aria-label={label} className="ui-menu fixed" style={position}
        onKeyDown={(event) => {
          event.stopPropagation();
          const buttons = Array.from(menuRef.current!.querySelectorAll<HTMLButtonElement>("button"));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          let nextIndex: number;
          switch (event.key) {
            case "Escape": event.preventDefault(); setOpen(false); triggerRef.current!.focus(); return;
            case "Tab": triggerRef.current!.focus(); setOpen(false); return;
            case "ArrowDown": nextIndex = (index + 1) % buttons.length; break;
            case "ArrowUp": nextIndex = (index - 1 + buttons.length) % buttons.length; break;
            case "Home": nextIndex = 0; break;
            case "End": nextIndex = buttons.length - 1; break;
            default: return;
          }
          event.preventDefault(); buttons[nextIndex].focus();
        }}>
        {choices.map((choice) => <button key={choice.key} type="button" role="option" aria-selected={choice.key === selectedKey} tabIndex={-1} className="ui-menu-item break-words"
          onClick={() => { setOpen(false); triggerRef.current!.focus(); onChoose(choice.value); }}>{choice.label}</button>)}
      </div>, document.body)}
  </>;
}
