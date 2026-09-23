import path from "node:path";
import { readJsonFile, writeJsonFile } from "../../../shared/main/json-storage.js";

/** Load the project's latest persisted editing state. */
export function loadProjectState(root) {
  return readJsonFile(path.join(root, "mutag.json"), null);
}

/** Queue a complete editing snapshot for this project. */
export function saveProjectState(root, state) {
  return writeJsonFile(path.join(root, "mutag.json"), state);
}
