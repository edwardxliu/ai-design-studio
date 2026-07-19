import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalAssetStore } from "./local-asset-store";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

describe("createLocalAssetStore", () => {
  it("saves uploaded assets under a public path and appends a manifest record", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });

    const asset = await store.saveUploadedAsset({
      projectId: "project-demo",
      productId: "product-upload",
      type: "product-photo",
      filename: "Kitchen Hero Shot.png",
      contentType: "image/png",
      bytes: Buffer.from("fake image bytes")
    });

    expect(asset.source).toBe("uploaded");
    expect(asset.url).toMatch(/^\/uploads\/project-demo\/asset-/);
    expect(asset.filename).toBe("Kitchen Hero Shot.png");
    expect(asset.metadata).toMatchObject({
      contentType: "image/png",
      sizeBytes: String(Buffer.byteLength("fake image bytes"))
    });

    const savedBytes = await readFile(join(root, "public", asset.url.replace(/^\//, "")));
    expect(savedBytes.toString()).toBe("fake image bytes");

    const manifest = await store.readAssetManifest();
    expect(manifest).toHaveLength(1);
    expect(manifest[0]).toMatchObject({
      id: asset.id,
      projectId: "project-demo",
      productId: "product-upload",
      type: "product-photo"
    });
  });

  it("keeps every record when assets are saved concurrently", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });

    await Promise.all(
      ["a.png", "b.png", "c.png", "d.png", "e.png"].map((filename) =>
        store.saveUploadedAsset({
          projectId: "project-demo",
          type: "product-photo",
          filename,
          contentType: "image/png",
          bytes: Buffer.from(filename)
        })
      )
    );

    const manifest = await store.readAssetManifest();
    expect(manifest).toHaveLength(5);
  });

  it("reads back uploaded asset bytes by asset id", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });

    const asset = await store.saveUploadedAsset({
      projectId: "project-demo",
      type: "phone-shot",
      filename: "phone.png",
      contentType: "image/png",
      bytes: Buffer.from("phone bytes")
    });

    const resolved = await store.readAssetBytes(asset.id);
    expect(resolved).not.toBeNull();
    expect(resolved?.bytes.toString()).toBe("phone bytes");
    expect(resolved?.contentType).toBe("image/png");
    expect(resolved?.filename).toBe("phone.png");
  });

  it("resolves seed assets provided at store creation", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(join(root, "public", "demo-assets"), { recursive: true });
    await writeFile(join(root, "public", "demo-assets", "seed.png"), "seed bytes");

    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public"),
      seedAssets: [
        {
          id: "asset-seed",
          projectId: "project-demo",
          type: "product-photo",
          filename: "seed.png",
          url: "/demo-assets/seed.png",
          source: "demo-seed"
        }
      ]
    });

    const resolved = await store.readAssetBytes("asset-seed");
    expect(resolved?.bytes.toString()).toBe("seed bytes");
    expect(resolved?.contentType).toBe("image/png");
  });

  it("removes an uploaded asset from the manifest and disk", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });

    const asset = await store.saveUploadedAsset({
      projectId: "project-demo",
      type: "product-photo",
      filename: "to-delete.png",
      contentType: "image/png",
      bytes: Buffer.from("bytes")
    });

    expect(await store.removeAsset(asset.id)).toBe(true);
    expect(await store.readAssetManifest()).toHaveLength(0);
    expect(await store.readAssetBytes(asset.id)).toBeNull();
  });

  it("refuses to remove seed assets and unknown ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public"),
      seedAssets: [
        {
          id: "asset-seed",
          projectId: "project-demo",
          type: "product-photo",
          filename: "seed.png",
          url: "/demo-assets/seed.png",
          source: "demo-seed"
        }
      ]
    });

    expect(await store.removeAsset("asset-seed")).toBe(false);
    expect(await store.removeAsset("asset-missing")).toBe(false);
  });

  it("returns null for unknown asset ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-assets-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });

    expect(await store.readAssetBytes("asset-missing")).toBeNull();
  });
});
