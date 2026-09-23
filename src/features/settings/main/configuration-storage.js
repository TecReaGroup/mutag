import os from "node:os";
import path from "node:path";
import { readJsonFile, writeJsonFile } from "../../../shared/main/json-storage.js";
import { logEvent } from "../../../shared/main/logging.js";

const CONFIG_PATH = path.join(os.tmpdir(), "mutag_config.json");

/** Load the application configuration from its existing location. */
export async function loadConfiguration() {
  const config = await readJsonFile(CONFIG_PATH, null);
  logEvent("INFO", "config", config ? `已加载配置，模型数量=${config.models?.length ?? (config.openAI ? 1 : 0)}` : "未找到可用配置，使用默认配置");
  return config;
}

/** Persist the application configuration in submission order. */
export async function saveConfiguration(config) {
  await writeJsonFile(CONFIG_PATH, config ?? {});
  logEvent("INFO", "config", `配置已保存，模型数量=${config?.models?.length ?? 0}`);
  return { ok: true };
}
