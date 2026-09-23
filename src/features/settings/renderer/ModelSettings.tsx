import { useState } from "react";
import { Plus } from "lucide-react";
import type { ModelConfig } from "../contracts";
import type { Translate } from "../../../shared/renderer/localization";
import { Button, TextField } from "../../../shared/renderer/controls";
import { Disclosure } from "../../../shared/renderer/Disclosure";
import { DEFAULT_MODEL, normalizeModel, positiveInteger } from "./model-config";

interface ModelSettingsProps {
  models: ModelConfig[];
  activeModel: ModelConfig;
  onChange: (models: ModelConfig[], activeModel: ModelConfig) => void;
  t: Translate;
}

/** Own model drafts and commit complete, validated profile changes. */
export function ModelSettings({ models, activeModel, onChange, t }: ModelSettingsProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(DEFAULT_MODEL);
  const [error, setError] = useState("");
  const profiles = editing === "" ? [...models, { ...DEFAULT_MODEL, model: "" }] : models;
  const saveProfile = (originalModel: string) => {
    const updated = normalizeModel(draft);
    if (!updated.model || !updated.baseURL) { setError(t("Base URL and Model are required.", "Base URL 和 Model 不能为空。")); return; }
    if (models.some((profile) => profile.model === updated.model && profile.model !== originalModel)) { setError(t("Model already exists.", "Model 已存在，不能重复。")); return; }
    const updatedModels = originalModel ? models.map((profile) => profile.model === originalModel ? updated : profile) : [...models, updated];
    onChange(updatedModels, !models.length || activeModel.model === originalModel ? updated : activeModel);
    setEditing(null); setError("");
  };
  const deleteProfile = (model: string) => {
    const remaining = models.filter((profile) => profile.model !== model);
    onChange(remaining, activeModel.model === model ? remaining[0] ?? { ...DEFAULT_MODEL, model: "", apiKey: "" } : activeModel);
    setEditing(null); setError("");
  };
  return <div className="max-w-2xl space-y-4">
    <div><h2 className="text-sm">{t("OpenAI-compatible API", "兼容 OpenAI 的接口")}</h2><p className="ui-description mt-1">{t("Used for conversations and commands. Any OpenAI-compatible endpoint works.", "用于对话和命令，支持兼容 OpenAI 的接口。")}</p></div>
    {profiles.map((profile) => <Disclosure key={profile.model} title={`${profile.model || t("New model", "新模型")}${profile.model && profile.model === activeModel.model ? t(" · Active", " · 当前模型") : ""}`} expanded={editing === profile.model}
      onToggle={() => { setEditing(editing === profile.model ? null : profile.model); setDraft(profile); setError(""); }}>
      <TextField label={t("Model", "模型")} autoFocus value={draft.model} onChange={(event) => { setError(""); setDraft({ ...draft, model: event.target.value }); }} placeholder="gpt-4o-mini" />
      <TextField label={t("Base URL", "接口地址")} value={draft.baseURL} onChange={(event) => setDraft({ ...draft, baseURL: event.target.value })} placeholder="https://api.openai.com/v1" />
      <TextField label={t("API Key", "API 密钥")} type="password" value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} placeholder="sk-..." />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("Files per request", "每批文件数")} type="number" min={1} step={1} value={draft.filesPerRequest} onChange={(event) => setDraft({ ...draft, filesPerRequest: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.filesPerRequest) })} />
        <TextField label={t("Concurrency", "并发数")} type="number" min={1} step={1} value={draft.concurrency} onChange={(event) => setDraft({ ...draft, concurrency: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.concurrency) })} />
      </div>
      <p className="ui-description">{t("All LLM commands use the selected model's settings. Batch size counts files for /meta and artist directories for /image. Conversations use one request.", "所有 LLM 命令使用所选模型的配置。/meta 按文件分批，/image 按歌手目录分批；普通对话使用单次请求。")}</p>
      <TextField label={t("Maximum wait (seconds)", "最多等待秒数")} type="number" min={1} step={1} value={draft.timeoutSeconds} onChange={(event) => setDraft({ ...draft, timeoutSeconds: positiveInteger(event.target.valueAsNumber, DEFAULT_MODEL.timeoutSeconds) })}
        description={t("Timeout per LLM request, 60 seconds by default. Metadata batches are timed separately.", "单次 LLM 请求的等待上限，默认 60 秒；元数据补齐按每批请求计时。")} />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-3"><Button className="ui-primary-button" onClick={() => saveProfile(profile.model)}>{t("Save", "保存")}</Button><Button className="ui-danger-button" onClick={() => deleteProfile(profile.model)}>{t("Delete", "删除")}</Button></div>
    </Disclosure>)}
    <Button className="ui-add-button" disabled={editing === ""} onClick={() => { setEditing(""); setDraft({ ...DEFAULT_MODEL, model: "", apiKey: "" }); setError(""); }}><Plus size={14} />{t("Add", "添加")}</Button>
  </div>;
}
