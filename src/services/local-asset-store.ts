import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join, resolve } from "node:path";
import type { Asset, AssetType } from "@/src/domain/types";

export type LocalAssetStoreOptions = {
  dataDir: string;
  publicDir: string;
};

export type SaveUploadedAssetInput = {
  projectId: string;
  productId?: string;
  type: AssetType;
  filename: string;
  contentType?: string;
  bytes: Buffer;
};

export type SaveGeneratedImageInput = {
  taskId: string;
  filename?: string;
  contentType?: string;
  bytes: Buffer;
};

export type SavedGeneratedImage = {
  id: string;
  url: string;
  filePath: string;
};

export type LocalAssetStore = {
  saveUploadedAsset(input: SaveUploadedAssetInput): Promise<Asset>;
  saveGeneratedImage(input: SaveGeneratedImageInput): Promise<SavedGeneratedImage>;
  readAssetManifest(): Promise<Asset[]>;
};

export function createLocalAssetStore(options: LocalAssetStoreOptions): LocalAssetStore {
  const dataDir = resolve(options.dataDir);
  const publicDir = resolve(options.publicDir);
  const manifestPath = join(dataDir, "assets.json");

  async function readAssetManifest(): Promise<Asset[]> {
    try {
      const raw = await readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function appendAsset(asset: Asset): Promise<void> {
    await mkdir(dataDir, { recursive: true });
    const manifest = await readAssetManifest();
    await writeFile(manifestPath, `${JSON.stringify([...manifest, asset], null, 2)}\n`, "utf8");
  }

  return {
    async saveUploadedAsset(input) {
      const id = `asset-${randomUUID()}`;
      const projectSegment = sanitizePathSegment(input.projectId);
      const extension = getExtension(input.filename, input.contentType);
      const storedFilename = `${id}${extension}`;
      const url = `/uploads/${projectSegment}/${storedFilename}`;
      const filePath = resolve(publicDir, url.replace(/^\//, ""));
      assertInside(publicDir, filePath);
      await mkdir(resolve(filePath, ".."), { recursive: true });
      await writeFile(filePath, input.bytes);

      const asset: Asset = {
        id,
        projectId: input.projectId,
        productId: input.productId,
        type: input.type,
        filename: input.filename,
        url,
        source: "uploaded",
        metadata: {
          contentType: input.contentType ?? "application/octet-stream",
          storedFilename,
          sizeBytes: String(input.bytes.byteLength)
        }
      };
      await appendAsset(asset);
      return asset;
    },

    async saveGeneratedImage(input) {
      const id = `asset-${randomUUID()}`;
      const taskSegment = sanitizePathSegment(input.taskId);
      const extension = getExtension(input.filename ?? "generated.png", input.contentType ?? "image/png");
      const url = `/generated/${taskSegment}/${id}${extension}`;
      const filePath = resolve(publicDir, url.replace(/^\//, ""));
      assertInside(publicDir, filePath);
      await mkdir(resolve(filePath, ".."), { recursive: true });
      await writeFile(filePath, input.bytes);
      return { id, url, filePath };
    },

    readAssetManifest
  };
}

export function createDefaultLocalAssetStore(): LocalAssetStore {
  const root = process.cwd();
  return createLocalAssetStore({
    dataDir: join(root, "data"),
    publicDir: join(root, "public")
  });
}

function sanitizePathSegment(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  return sanitized || "default";
}

function getExtension(filename: string, contentType?: string): string {
  const existing = extname(filename).toLowerCase();
  if (existing && existing.length <= 8) {
    return existing;
  }
  if (contentType === "image/jpeg") {
    return ".jpg";
  }
  if (contentType === "image/webp") {
    return ".webp";
  }
  if (contentType === "image/png") {
    return ".png";
  }
  return ".bin";
}

function assertInside(root: string, candidate: string): void {
  const relative = candidate.slice(root.length);
  if (!candidate.startsWith(root) || relative.startsWith("..")) {
    throw new Error("Resolved asset path escapes the configured public directory.");
  }
}
