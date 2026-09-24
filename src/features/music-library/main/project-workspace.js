import fs from "node:fs/promises";
import path from "node:path";

export const PROJECT_WORKSPACE_NAME = ".temp";

/** Resolve project-owned state and staged assets within the music library. */
export function projectWorkspace(root) {
  return path.join(root, PROJECT_WORKSPACE_NAME);
}

/** Create the project workspace before persisting state or proposals. */
export async function ensureProjectWorkspace(root) {
  const directory = projectWorkspace(root);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}
