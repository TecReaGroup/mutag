const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const viteBin = path.join(root, "node_modules", ".bin", isWindows ? "vite.cmd" : "vite");
const electronBin = path.join(root, "node_modules", ".bin", isWindows ? "electron.cmd" : "electron");
const devServerUrl = "http://127.0.0.1:5173";

const children = new Set();

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function startChildProcess(command, args, options = {}) {
  const childCommand = isWindows ? (process.env.ComSpec || "cmd.exe") : command;
  const childArgs = isWindows
    ? ["/d", "/s", "/c", [quoteCmdArg(command), ...args.map(quoteCmdArg)].join(" ")]
    : args;

  const child = spawn(childCommand, childArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...options,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 250);
      });

      req.setTimeout(1000, () => {
        req.destroy();
      });
    };

    check();
  });
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

(async () => {
  const vite = startChildProcess(viteBin, ["--host", "127.0.0.1"]);

  vite.on("exit", (code) => {
    if (children.size === 0) process.exit(code ?? 0);
  });

  try {
    await waitForServer(devServerUrl);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    shutdown(1);
  }

  const electron = startChildProcess(electronBin, ["."], {
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: devServerUrl,
    },
  });

  electron.on("exit", (code) => shutdown(code ?? 0));
})();
