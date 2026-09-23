import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const LOG_DIRECTORY = path.resolve("log");

/** Persist one UTC+8 event and mirror it to the development terminal. */
export function logEvent(level, module, message) {
  const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const text = String(message).replace(/[\r\n]+/g, " ");
  const line = `[${timestamp.slice(0, 10)} ${timestamp.slice(11, 19)} +08:00] [${level}] [${module}] - ${text}\n`;
  process.stdout.write(line, "utf8");
  try {
    mkdirSync(LOG_DIRECTORY, { recursive: true });
    appendFileSync(path.join(LOG_DIRECTORY, `log_${timestamp.slice(0, 10)}.log`), line, "utf8");
  } catch (error) {
    process.stderr.write(`[${timestamp.slice(0, 10)} ${timestamp.slice(11, 19)} +08:00] [ERROR] [logging] - 无法写入日志：${error.code ?? "未知错误"}\n`);
  }
}
