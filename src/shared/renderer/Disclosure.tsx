import { useId } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "./controls";

/** Associate a collapsible section with its accessible trigger. */
export function Disclosure({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  const contentId = useId();
  return (
    <section className="overflow-hidden rounded border border-border bg-surface">
      <Button aria-expanded={expanded} aria-controls={contentId} onClick={onToggle} className="w-full justify-between border-0 px-3 py-2 text-left">
        <span className="min-w-0 break-all">{title}</span>
        <ChevronRight size={16} className={`ui-disclosure-chevron shrink-0 ${expanded ? "rotate-90" : ""}`} />
      </Button>
      <div id={contentId} hidden={!expanded} className="ui-disclosure-content space-y-3 border-t border-border p-4">{expanded && children}</div>
    </section>
  );
}
