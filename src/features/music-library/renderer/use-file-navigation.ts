import { useCallback, useEffect } from "react";
import type { AudioFile } from "../../audio-tags/contracts";

/** Navigate the library without stealing keys from controls or text input. */
export function useFileNavigation(files: AudioFile[], selectedId: string, onSelect: (id: string) => void, disabled: boolean) {
  const selectedIndex = files.findIndex((file) => file.id === selectedId);
  const previous = useCallback(() => {
    if (!disabled && selectedIndex > 0) onSelect(files[selectedIndex - 1].id);
  }, [disabled, files, onSelect, selectedIndex]);
  const next = useCallback(() => {
    if (!disabled && selectedIndex >= 0 && selectedIndex < files.length - 1) onSelect(files[selectedIndex + 1].id);
  }, [disabled, files, onSelect, selectedIndex]);
  useEffect(() => {
    if (disabled) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button, [role="listbox"], [role="separator"]'))) return;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); next(); }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [disabled, previous, next]);
  return { previous, next, previousAvailable: selectedIndex > 0, nextAvailable: selectedIndex >= 0 && selectedIndex < files.length - 1 };
}
