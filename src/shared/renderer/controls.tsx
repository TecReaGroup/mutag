import { forwardRef, useId } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Apply the shared button contract while preserving native attributes. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = "", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={`ui-button ${className}`} {...props} />;
});

/** Give icon-only actions an accessible name and a consistent hit target. */
export function IconButton({ title, className = "", ...props }: ButtonProps & { title: string }) {
  return <Button aria-label={title} title={title} className={`ui-icon-button ${className}`} {...props} />;
}

/** Keep field labels, descriptions and input styling together. */
export function TextField({ label, description, id, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: ReactNode }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={inputId} className="ui-field-label">{label}</label>
      <input {...props} id={inputId} aria-describedby={description ? `${inputId}-description` : undefined} className="ui-input" />
      {description && <p id={`${inputId}-description`} className="ui-description">{description}</p>}
    </div>
  );
}

export function PanelHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ui-panel-header ${className}`}>{children}</div>;
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded bg-skeleton ${className}`} />;
}
