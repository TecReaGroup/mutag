import fs from "node:fs/promises";
import path from "node:path";
import { logEvent } from "./logging.js";

const PENDING_WRITES = new Map();

/** Read a snapshot after previously submitted writes have settled. */
export async function readJsonFile(filePath, fallback) {
  const destination = path.resolve(filePath);
  await PENDING_WRITES.get(destination);
  try {
    return JSON.parse(await fs.readFile(destination, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") logEvent("WARN", "storage", `无法读取 JSON ${destination}：${error.message}`);
    return fallback;
  }
}

/** Serialize writes per destination without blocking unrelated projects. */
export function writeJsonFile(filePath, snapshot) {
  const destination = path.resolve(filePath);
  const serialized = JSON.stringify(snapshot, null, 2);
  const previousWrite = PENDING_WRITES.get(destination) ?? Promise.resolve();
  const write = previousWrite.then(() => fs.writeFile(destination, serialized, "utf8"));
  const settled = write.catch((error) => {
    logEvent("ERROR", "storage", `保存 JSON 失败 ${destination}：${error.message}`);
  });
  PENDING_WRITES.set(destination, settled);
  void settled.then(() => {
    if (PENDING_WRITES.get(destination) === settled) PENDING_WRITES.delete(destination);
  });
  return write;
}
