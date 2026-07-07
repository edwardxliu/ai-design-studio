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
});
