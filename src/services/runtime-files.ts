import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

export type RuntimeFile = {
  bytes: Buffer;
  contentType: string;
};

const contentTypesByExtension: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8"
};

export type RuntimeImageEntry = {
  url: string;
  filename: string;
  taskId: string;
  modifiedAt: string;
};

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

/** Lists generated image files newest-first, mapped to their public urls. */
export async function listRuntimeImages(
  baseDir: string,
  urlPrefix: string,
  limit = 60
): Promise<RuntimeImageEntry[]> {
  const base = resolve(baseDir);
  let names: string[];
  try {
    names = await readdir(base, { recursive: true });
  } catch {
    return [];
  }

  const entries: Array<RuntimeImageEntry & { mtimeMs: number }> = [];
  for (const name of names) {
    if (!imageExtensions.has(extname(name).toLowerCase())) {
      continue;
    }
    const filePath = join(base, name);
    try {
      const info = await stat(filePath);
      if (!info.isFile()) {
        continue;
      }
      const relativePath = relative(base, filePath).split(sep);
      entries.push({
        url: `${urlPrefix}/${relativePath.join("/")}`,
        filename: relativePath[relativePath.length - 1],
        taskId: relativePath.length > 1 ? relativePath[0] : "",
        modifiedAt: info.mtime.toISOString(),
        mtimeMs: info.mtimeMs
      });
    } catch {
      // Skip files that disappear mid-scan.
    }
  }

  return entries
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, limit)
    .map(({ mtimeMs: _mtimeMs, ...entry }) => entry);
}

/**
 * Reads a runtime-written file (uploads / generated outputs) for serving via a
 * route handler. `next start` only serves public/ files that existed at build
 * time, so these directories need an explicit route.
 */
export async function readRuntimeFile(
  baseDir: string,
  pathSegments: string[]
): Promise<RuntimeFile | null> {
  const base = resolve(baseDir);
  const target = resolve(base, ...pathSegments);

  if (target !== base && !target.startsWith(base + sep)) {
    return null;
  }

  try {
    const bytes = await readFile(target);
    return {
      bytes,
      contentType:
        contentTypesByExtension[extname(target).toLowerCase()] ?? "application/octet-stream"
    };
  } catch {
    return null;
  }
}
