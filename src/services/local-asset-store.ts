import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join, resolve } from "node:path";
import type { Asset, AssetType } from "@/src/domain/types";

export type LocalAssetStoreOptions = {
  dataDir: string;
  publicDir: string;
  seedAssets?: Asset[];
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

export type ResolvedAssetFile = {
  bytes: Buffer;
  contentType: string;
  filename: string;
};

export type LocalAssetStore = {
  saveUploadedAsset(input: SaveUploadedAssetInput): Promise<Asset>;
  saveGeneratedImage(input: SaveGeneratedImageInput): Promise<SavedGeneratedImage>;
  readAssetManifest(): Promise<Asset[]>;
  readAssetBytes(assetId: string): Promise<ResolvedAssetFile | null>;
  removeAsset(assetId: string): Promise<boolean>;
};

export function createLocalAssetStore(options: LocalAssetStoreOptions): LocalAssetStore {
  const dataDir = resolve(options.dataDir);
  const publicDir = resolve(options.publicDir);
  const seedAssets = options.seedAssets ?? [];
  const manifestPath = join(dataDir, "assets.json");
  let manifestWriteQueue: Promise<void> = Promise.resolve();

  async function readAssetManifest(): Promise<Asset[]> {
    try {
      const raw = await readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function appendAsset(asset: Asset): Promise<void> {
    // Serialize read-modify-write cycles so concurrent saves cannot drop records.
    const write = manifestWriteQueue.then(async () => {
      await mkdir(dataDir, { recursive: true });
      const manifest = await readAssetManifest();
      await writeFile(manifestPath, `${JSON.stringify([...manifest, asset], null, 2)}\n`, "utf8");
    });
    manifestWriteQueue = write.catch(() => undefined);
    return write;
  }

  async function removeAsset(assetId: string): Promise<boolean> {
    // Seed assets ship with the repo and are not user-removable.
    const manifest = await readAssetManifest();
    const asset = manifest.find((item) => item.id === assetId);
    if (!asset) {
      return false;
    }

    const removal = manifestWriteQueue.then(async () => {
      const current = await readAssetManifest();
      await writeFile(
        manifestPath,
        `${JSON.stringify(current.filter((item) => item.id !== assetId), null, 2)}\n`,
        "utf8"
      );
    });
    manifestWriteQueue = removal.catch(() => undefined);
    await removal;

    const filePath = resolve(publicDir, asset.url.replace(/^\//, ""));
    assertInside(publicDir, filePath);
    await rm(filePath, { force: true });
    return true;
  }

  async function readAssetBytes(assetId: string): Promise<ResolvedAssetFile | null> {
    const manifest = await readAssetManifest();
    const asset =
      manifest.find((item) => item.id === assetId) ??
      seedAssets.find((item) => item.id === assetId);

    if (!asset) {
      return null;
    }

    const filePath = resolve(publicDir, asset.url.replace(/^\//, ""));
    assertInside(publicDir, filePath);

    try {
      const bytes = await readFile(filePath);
      return {
        bytes,
        contentType: asset.metadata?.contentType ?? contentTypeFromFilename(asset.url),
        filename: asset.filename
      };
    } catch {
      return null;
    }
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

    readAssetManifest,
    readAssetBytes,
    removeAsset
  };
}

export function createDefaultLocalAssetStore(seedAssets?: Asset[]): LocalAssetStore {
  const root = process.cwd();
  return createLocalAssetStore({
    dataDir: join(root, "data"),
    publicDir: join(root, "public"),
    seedAssets
  });
}

function sanitizePathSegment(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  return sanitized || "default";
}

function contentTypeFromFilename(filename: string): string {
  const extension = extname(filename).toLowerCase();
  const byExtension: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf"
  };
  return byExtension[extension] ?? "application/octet-stream";
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
