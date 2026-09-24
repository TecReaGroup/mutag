import path from "node:path";
import fs from "node:fs/promises";
import { readJsonFile, writeJsonFile } from "../../../shared/main/json-storage.js";
import { logEvent } from "../../../shared/main/logging.js";
import { projectWorkspace, ensureProjectWorkspace } from "./project-workspace.js";

/** Load the project's latest persisted editing state. */
export async function loadProjectState(root) {
  const state = await readJsonFile(path.join(projectWorkspace(root), "mutag.json"), null);
  if (state !== null) return state;
  const legacyPath = path.join(root, "mutag.json");
  const legacyState = await readJsonFile(legacyPath, null);
  if (legacyState !== null) {
    await saveProjectState(root, legacyState);
    try {
      await fs.unlink(legacyPath);
      logEvent("INFO", "storage", `项目状态已迁移到 ${path.join(projectWorkspace(root), "mutag.json")}`);
    } catch (error) { logEvent("WARN", "storage", `项目状态已迁移，旧文件清理失败：${error.message}`); }
  }
  return legacyState;
}

/** Queue a complete editing snapshot for this project. */
export async function saveProjectState(root, state) {
  const directory = await ensureProjectWorkspace(root);
  return writeJsonFile(path.join(directory, "mutag.json"), state);
}
