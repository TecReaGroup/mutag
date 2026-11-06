import { logEvent } from "../../../shared/main/logging.js";

const BACKUP_FILE_NAME = "mutag_config.json";
const REQUEST_TIMEOUT_MS = 30_000;
// 405 means the collection already exists; some servers answer 301 for an existing folder.
const EXISTING_FOLDER_STATUSES = new Set([301, 405]);

/** Upload the configuration backup, creating the remote directory chain first. */
export async function uploadConfigBackup(webdav, backup) {
  const remote = resolveRemote(webdav);
  for (const folderUrl of remote.folderUrls) {
    const response = await sendRequest(remote, folderUrl, { method: "MKCOL" });
    if (!response.ok && !EXISTING_FOLDER_STATUSES.has(response.status)) throw failure("创建目录", folderUrl, response);
  }
  const response = await sendRequest(remote, remote.fileUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(backup, null, 2),
  });
  if (!response.ok) throw failure("上传备份", remote.fileUrl, response);
  logEvent("INFO", "webdav", `配置已备份到 ${remote.fileUrl}`);
  return { ok: true, location: remote.fileUrl };
}

/** Download the configuration backup as untrusted JSON for the renderer to normalize. */
export async function downloadConfigBackup(webdav) {
  const remote = resolveRemote(webdav);
  const response = await sendRequest(remote, remote.fileUrl, { method: "GET" });
  if (response.status === 404) throw new Error(`WebDAV 上没有找到备份：${remote.fileUrl}`);
  if (!response.ok) throw failure("下载备份", remote.fileUrl, response);
  let backup;
  try {
    backup = JSON.parse(await response.text());
  } catch {
    throw new Error("WebDAV 备份不是有效的 JSON");
  }
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) throw new Error("WebDAV 备份格式无效");
  logEvent("INFO", "webdav", `已从 ${remote.fileUrl} 下载配置备份`);
  return backup;
}

function resolveRemote({ url, username, password, directory }) {
  let base;
  try {
    base = new URL(String(url ?? "").trim());
  } catch {
    throw new Error("WebDAV 地址无效");
  }
  if (base.protocol !== "http:" && base.protocol !== "https:") throw new Error("WebDAV 地址必须以 http:// 或 https:// 开头");
  const root = base.href.endsWith("/") ? base.href : `${base.href}/`;
  const segments = String(directory ?? "").split(/[\\/]+/).filter(Boolean).map(encodeURIComponent);
  return {
    folderUrls: segments.map((_, index) => new URL(`${segments.slice(0, index + 1).join("/")}/`, root).href),
    fileUrl: new URL([...segments, BACKUP_FILE_NAME].join("/"), root).href,
    authorization: `Basic ${Buffer.from(`${username ?? ""}:${password ?? ""}`, "utf8").toString("base64")}`,
  };
}

async function sendRequest(remote, url, init) {
  try {
    return await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: remote.authorization },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logEvent("ERROR", "webdav", `${init.method} ${url} 请求失败：${error.message}`);
    throw new Error(`无法连接 WebDAV：${error.name === "TimeoutError" ? "请求超时" : error.message}`);
  }
}

function failure(action, url, response) {
  logEvent("ERROR", "webdav", `${action}失败 ${url}：HTTP ${response.status}`);
  if (response.status === 401 || response.status === 403) return new Error(`WebDAV ${action}失败：账号或密码错误（HTTP ${response.status}）`);
  return new Error(`WebDAV ${action}失败：HTTP ${response.status} ${response.statusText}`);
}
