import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalAssetStore, type LocalAssetStore } from "./local-asset-store";
import { createProductRegistry } from "./product-registry";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

async function createFixture(): Promise<{ store: LocalAssetStore; dataDir: string }> {
  const root = await mkdtemp(join(tmpdir(), "midea-registry-"));
  tempRoots.push(root);
  const dataDir = join(root, "data");
  const store = createLocalAssetStore({
    dataDir,
    publicDir: join(root, "public")
  });
  return { store, dataDir };
}

describe("product registry", () => {
  it("lists only user-created products", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });

    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance",
      brand: "Midea"
    });

    const products = await registry.listProducts();
    const ids = products.map((product) => product.id);

    expect(ids).toEqual([created.id]);

    const userProduct = products.find((product) => product.id === created.id);
    expect(userProduct?.displayName).toBe("SmartWash 洗衣机 X1");
    expect(userProduct?.profile.detectedFeatures).toEqual([]);
    expect(userProduct?.acceptsUserUploads).toBe(true);
  });

  it("attaches uploaded assets to the owning product", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });

    await store.saveUploadedAsset({
      projectId: "project-demo",
      productId: created.id,
      type: "product-photo",
      filename: "washer.png",
      contentType: "image/png",
      bytes: Buffer.from("washer photo")
    });

    const product = await registry.getProduct(created.id);
    expect(product?.assets).toHaveLength(1);
    expect(product?.assets[0].filename).toBe("washer.png");
  });

  it("updates selling points for user products", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });

    await registry.updateSellingPoints(created.id, [
      {
        id: "feature-steam",
        title: "Steam Care",
        shortLabel: "Steam Care",
        benefit: "Removes wrinkles and allergens",
        priority: 1
      }
    ]);

    const product = await registry.getProduct(created.id);
    expect(product?.profile.detectedFeatures).toHaveLength(1);
    expect(product?.profile.detectedFeatures[0].shortLabel).toBe("Steam Care");
  });

  it("recognizes selling points from an uploaded pipe-format product document", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });

    await store.saveUploadedAsset({
      projectId: "project-demo",
      productId: created.id,
      type: "document",
      filename: "product-info.txt",
      contentType: "text/plain",
      bytes: Buffer.from(
        [
          "Steam Care|Steam Care|Removes wrinkles and allergens|110C steam",
          "Big Drum|10kg Drum|Family-size loads in one wash|10kg capacity"
        ].join("\n"),
        "utf8"
      )
    });

    const result = await registry.recognizeSellingPoints(created.id);

    expect(result.product.profile.detectedFeatures).toHaveLength(2);
    expect(result.product.profile.detectedFeatures[0]).toMatchObject({
      title: "Steam Care",
      shortLabel: "Steam Care",
      benefit: "Removes wrinkles and allergens",
      technicalProof: "110C steam",
      priority: 1
    });
    expect(result.recognizedFrom).toBe("product-info.txt");
  });

  it("recognizes selling points from a JSON product document", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });

    await store.saveUploadedAsset({
      projectId: "project-demo",
      productId: created.id,
      type: "document",
      filename: "features.json",
      contentType: "application/json",
      bytes: Buffer.from(
        JSON.stringify([
          { title: "Inverter Motor", benefit: "Quiet and durable", technicalProof: "52dB" }
        ]),
        "utf8"
      )
    });

    const result = await registry.recognizeSellingPoints(created.id);

    expect(result.product.profile.detectedFeatures).toHaveLength(1);
    expect(result.product.profile.detectedFeatures[0].shortLabel).toBe("Inverter Motor");
  });

  it("routes uploaded PDF documents through the language-model extractor", async () => {
    const { store, dataDir } = await createFixture();
    const extractPdfSellingPoints = vi.fn().mockResolvedValue({
      sellingPoints: [
        {
          id: "feature-extracted-1",
          title: "SPACE Master Large Capacity",
          shortLabel: "640L Capacity",
          benefit: "Larger space to store food",
          technicalProof: "23 cu.ft. / 640L",
          priority: 1,
          enabled: true
        }
      ],
      model: "gpt-4o-mini",
      isFallback: false
    });
    const registry = createProductRegistry({ dataDir, assetStore: store, extractPdfSellingPoints });
    const created = await registry.createProduct({
      name: "SPACE Master BCD-640",
      category: "Refrigerator"
    });

    await store.saveUploadedAsset({
      projectId: "project-demo",
      productId: created.id,
      type: "document",
      filename: "冰箱卖点.pdf",
      contentType: "application/pdf",
      bytes: Buffer.from("%PDF-1.4 selling points")
    });

    const result = await registry.recognizeSellingPoints(created.id);

    expect(extractPdfSellingPoints).toHaveBeenCalledTimes(1);
    const [bytes, filename, productName] = extractPdfSellingPoints.mock.calls[0];
    expect(bytes.toString()).toBe("%PDF-1.4 selling points");
    expect(filename).toBe("冰箱卖点.pdf");
    expect(productName).toBe("SPACE Master BCD-640");

    expect(result.recognizedFrom).toBe("冰箱卖点.pdf");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.isFallback).toBe(false);
    expect(result.product.profile.detectedFeatures[0].shortLabel).toBe("640L Capacity");
  });

  it("deletes a user product together with its uploaded assets", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });
    const asset = await store.saveUploadedAsset({
      projectId: "project-user-workspace",
      productId: created.id,
      type: "product-photo",
      filename: "washer.png",
      contentType: "image/png",
      bytes: Buffer.from("washer photo")
    });

    expect(await registry.deleteProduct(created.id)).toBe(true);
    expect(await registry.getProduct(created.id)).toBeNull();
    expect(await store.readAssetBytes(asset.id)).toBeNull();
  });

  it("returns false when deleting an unknown product", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });

    expect(await registry.deleteProduct("product-missing")).toBe(false);
  });

  it("throws a clear error when no product document exists to recognize", async () => {
    const { store, dataDir } = await createFixture();
    const registry = createProductRegistry({ dataDir, assetStore: store });
    const created = await registry.createProduct({
      name: "SmartWash 洗衣机 X1",
      category: "Laundry appliance"
    });

    await expect(registry.recognizeSellingPoints(created.id)).rejects.toThrow(
      /产品信息文档/
    );
  });
});
