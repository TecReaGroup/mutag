import { useRef } from "react";

/** Resize adjacent panels using pointer capture, including touch and pen input. */
export function ResizeDivider({ onDrag, label }: { onDrag: (delta: number) => void; label: string }) {
  const lastX = useRef(0);
  return (
    <div className="relative w-px shrink-0">
      <div
        role="separator"
        aria-label={label}
        aria-orientation="vertical"
        tabIndex={0}
        className="absolute inset-y-0 left-0 z-10 flex w-3 touch-none cursor-col-resize items-center border-l border-border text-border outline-none hover:border-primary focus-visible:border-primary"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          lastX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          onDrag(event.clientX - lastX.current);
          lastX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          event.stopPropagation();
          onDrag(event.key === "ArrowLeft" ? -16 : 16);
        }}
      ><span className="-ml-0.5 bg-surface py-1 text-xs">⋮</span></div>
    </div>
  );
}
