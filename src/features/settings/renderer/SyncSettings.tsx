import { useState } from "react";
import { CloudDownload, CloudUpload } from "lucide-react";
import type { WebdavConfig } from "../contracts";
import type { StaticTranslationKey } from "../../../shared/localization";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { Button, TextField } from "../../../shared/renderer/controls";
import { errorMessage } from "../../../shared/renderer/error-message";

interface SyncSettingsProps {
  webdav: WebdavConfig;
  onChange: (webdav: WebdavConfig) => void;
  onUpload: () => Promise<unknown>;
  onRestore: () => Promise<void>;
}

/** Edit WebDAV credentials and run one backup transfer at a time. */
export function SyncSettings({ webdav, onChange, onUpload, onRestore }: SyncSettingsProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ failed: boolean; message: string } | null>(null);
  const update = (changes: Partial<WebdavConfig>) => onChange({ ...webdav, ...changes });
  const transfer = async (operation: () => Promise<unknown>, successKey: StaticTranslationKey) => {
    setBusy(true); setStatus(null);
    try {
      await operation();
      setStatus({ failed: false, message: t(successKey) });
    } catch (failure) {
      setStatus({ failed: true, message: errorMessage(failure) });
    } finally { setBusy(false); }
  };
  const restore = () => { if (window.confirm(t("sync.restoreConfirm"))) void transfer(onRestore, "sync.restored"); };
  const unavailable = busy || !webdav.url.trim();
  return <div className="max-w-2xl space-y-4">
    <div><h2 className="text-sm">{t("sync.title")}</h2><p className="ui-description mt-1">{t("sync.description")}</p></div>
    <TextField label={t("sync.url")} value={webdav.url} onChange={(event) => update({ url: event.target.value })} placeholder="https://dav.example.com/dav/" />
    <div className="grid grid-cols-2 gap-3">
      <TextField label={t("sync.username")} autoComplete="username" value={webdav.username} onChange={(event) => update({ username: event.target.value })} />
      <TextField label={t("sync.password")} type="password" autoComplete="current-password" value={webdav.password} onChange={(event) => update({ password: event.target.value })} />
    </div>
    <TextField label={t("sync.directory")} value={webdav.directory} onChange={(event) => update({ directory: event.target.value })} placeholder="mutag/" description={t("sync.directoryDescription")} />
    <div className="flex gap-2">
      <Button disabled={unavailable} onClick={() => void transfer(onUpload, "sync.uploaded")}><CloudUpload size={14} />{t("sync.upload")}</Button>
      <Button disabled={unavailable} onClick={restore}><CloudDownload size={14} />{t("sync.restore")}</Button>
    </div>
    {busy && <p className="ui-description">{t("sync.working")}</p>}
    {status && <p role={status.failed ? "alert" : "status"} className={status.failed ? "text-xs text-destructive" : "ui-description"}>{status.message}</p>}
  </div>;
}
