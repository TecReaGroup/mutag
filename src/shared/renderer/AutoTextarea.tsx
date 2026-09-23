import type { TextareaHTMLAttributes } from "react";

/** Mirror wrapped text so the field grows without measuring the DOM. */
export function AutoTextarea({ value, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`relative ${className}`}>
      <div aria-hidden="true" className="invisible min-h-9 whitespace-pre-wrap break-words px-3 py-2 text-sm">{value ? `${value}\u200b` : props.placeholder || "\u200b"}</div>
      <textarea {...props} value={value} className="absolute inset-0 h-full w-full resize-none whitespace-pre-wrap break-words bg-transparent px-3 py-2 text-sm outline-none placeholder:text-placeholder placeholder:italic disabled:cursor-not-allowed" />
    </div>
  );
}
