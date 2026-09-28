import { useState } from "react";
import { Plus } from "lucide-react";
import type { ModelConfig } from "../contracts";
import type { StaticTranslationKey } from "../../../shared/localization";
import { useTranslation } from "../../../shared/renderer/LocalizationProvider";
import { Button, TextField } from "../../../shared/renderer/controls";
import { Disclosure } from "../../../shared/renderer/Disclosure";
import { DEFAULT_MODEL, normalizeModel, positiveInteger } from "./model-config";

interface ModelSettingsProps {
  models: ModelConfig[];
  activeModel: ModelConfig;
  onChange: (models: ModelConfig[], activeModel: ModelConfig) => void;
}

/** Persist valid model edits while retaining incomplete drafts. */
export function ModelSettings({ models, activeModel, onChange }: ModelSettingsProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(DEFAULT_MODEL);
  const [error, setError] = useState<StaticTranslationKey | null>(null);
  const profiles = editing === "" ? [...models, { ...DEFAULT_MODEL, model: "" }] : models;
  const updateProfile = (changes: Partial<ModelConfig>) => {
    const nextDraft = { ...draft, ...changes };
    setDraft(nextDraft);
    const originalModel = editing;
    const updated = normalizeModel(nextDraft);
    if (!updated.model || !updated.baseURL) { setError("models.required"); return; }
    if (models.some((profile) => profile.model === updated.model && profile.model !== originalModel)) { setError("models.duplicate"); return; }
    const updatedModels = originalModel ? models.map((profile) => profile.model === originalModel ? updated : profile) : [...models, updated];
    onChange(updatedModels, !models.length || activeModel.model === originalModel ? updated : activeModel);
    setEditing(updated.model); setError(null);
  };
  const deleteProfile = (model: string) => {
    const remaining = models.filter((profile) => profile.model !== model);
    onChange(remaining, activeModel.model === model ? remaining[0] ?? { ...DEFAULT_MODEL, model: "", apiKey: "" } : activeModel);
    setEditing(null); setError(null);
  };
  return <div className="max-w-2xl space-y-4">
    <div><h2 className="text-sm">{t("models.title")}</h2><p className="ui-description mt-1">{t("models.description")}</p></div>
    {profiles.map((profile, index) => <Disclosure key={index} title={profile.model && profile.model === activeModel.model ? t("models.active", { model: profile.model }) : profile.model || t("models.new")} expanded={editing === profile.model}
      onToggle={() => { setEditing(editing === profile.model ? null : profile.model); setDraft(profile); setError(null); }}>
      <TextField label={t("models.model")} autoFocus value={draft.model} onChange={(event) => updateProfile({ model: event.target.value })} placeholder="gpt-4o-mini" />
      <TextField label={t("models.baseUrl")} value={draft.baseURL} onChange={(event) => updateProfile({ baseURL: event.target.value })} placeholder="https://api.openai.com/v1" />
      <TextField label={t("models.apiKey")} type="password" value={draft.apiKey} onChange={(event) => updateProfile({ apiKey: event.target.value })} placeholder="sk-..." />
      {/gemini/i.test(draft.model) && <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" role="switch" checked={draft.uploadAudio} onChange={(event) => updateProfile({ uploadAudio: event.target.checked })} />{t("models.uploadAudio")}</label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" role="switch" checked={draft.webSearch} onChange={(event) => updateProfile({ webSearch: event.target.checked })} />{t("models.webSearch")}</label>
      </div>}
      {/image/i.test(draft.model) && <label className="flex items-center gap-2 text-xs"><input type="checkbox" role="switch" checked={draft.imageGeneration} onChange={(event) => updateProfile({ imageGeneration: event.target.checked })} />{t("models.imageGeneration")}</label>}
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("models.filesPerRequest")} type="number" min={1} step={1} value={draft.filesPerRequest} onChange={(event) => updateProfile({ filesPerRequest: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.filesPerRequest) })} />
        <TextField label={t("models.concurrency")} type="number" min={1} step={1} value={draft.concurrency} onChange={(event) => updateProfile({ concurrency: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.concurrency) })} />
      </div>
      <TextField label={t("models.timeout")} type="number" min={1} step={1} value={draft.timeoutSeconds} onChange={(event) => updateProfile({ timeoutSeconds: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.timeoutSeconds) })}
        description={t("models.timeoutDescription")} />
      {error && <p role="alert" className="text-xs text-destructive">{t(error)}</p>}
      <Button className="ui-danger-button w-full" onClick={() => deleteProfile(profile.model)}>{t("common.delete")}</Button>
    </Disclosure>)}
    <Button className="ui-add-button" disabled={editing === ""} onClick={() => { setEditing(""); setDraft({ ...DEFAULT_MODEL, model: "", apiKey: "" }); setError(null); }}><Plus size={14} />{t("common.add")}</Button>
  </div>;
}
