import { X } from "lucide-react";
import { IconButton } from "./controls";

export function ErrorNotice({ message, onDismiss, dismissLabel }: { message: string; onDismiss?: () => void; dismissLabel?: string }) {
  return <div role="alert" className="flex items-start gap-2 rounded border border-destructive bg-danger-muted px-3 py-2 text-xs text-danger-foreground"><span className="min-w-0 flex-1 break-words">{message}</span>{onDismiss && <IconButton title={dismissLabel ?? "Close"} onClick={onDismiss} className="bg-transparent"><X size={13} /></IconButton>}</div>;
}
