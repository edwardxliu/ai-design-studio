import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Asset, ProductWithProfile, SellingPoint } from "@/src/domain/types";
import type { LocalAssetStore } from "@/src/services/local-asset-store";

export type CreateProductInput = {
  name: string;
  category: string;
  brand?: string;
  modelName?: string;
};

export type RecognizeResult = {
  product: ProductWithProfile;
  recognizedFrom?: string;
  model?: string;
  isFallback?: boolean;
  failureReason?: string;
};

export type PdfSellingPointExtractor = (
  pdfBytes: Buffer,
  filename: string,
  productName?: string
) => Promise<{
  sellingPoints: SellingPoint[];
  model: string;
  isFallback: boolean;
  failureReason?: string;
}>;

export type ProductRegistry = {
  listProducts(): Promise<ProductWithProfile[]>;
  getProduct(productId: string): Promise<ProductWithProfile | null>;
  createProduct(input: CreateProductInput): Promise<ProductWithProfile>;
  updateSellingPoints(productId: string, points: SellingPoint[]): Promise<ProductWithProfile>;
  recognizeSellingPoints(productId: string): Promise<RecognizeResult>;
  deleteProduct(productId: string): Promise<boolean>;
};

export type ProductRegistryOptions = {
  dataDir: string;
  assetStore: LocalAssetStore;
  /** Parses free-form PDF product sheets via a language model. */
  extractPdfSellingPoints?: PdfSellingPointExtractor;
};

type StoredProduct = {
  id: string;
  name?: string;
  category?: string;
  brand?: string;
  modelName?: string;
  sellingPoints?: SellingPoint[];
  source: "user" | "seed-override";
  createdAt: string;
};

export function createProductRegistry(options: ProductRegistryOptions): ProductRegistry {
  const dataDir = resolve(options.dataDir);
  const productsPath = join(dataDir, "products.json");
  const assetStore = options.assetStore;
  let writeQueue: Promise<void> = Promise.resolve();

  async function readStored(): Promise<StoredProduct[]> {
    try {
      const raw = await readFile(productsPath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persist(mutate: (records: StoredProduct[]) => StoredProduct[]): Promise<void> {
    const write = writeQueue.then(async () => {
      await mkdir(dataDir, { recursive: true });
      const records = mutate(await readStored());
      await writeFile(productsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    });
    writeQueue = write.catch(() => undefined);
    return write;
  }

  async function toProfileProducts(): Promise<ProductWithProfile[]> {
    const stored = await readStored();
    const manifest = await assetStore.readAssetManifest();

    return stored
      .filter((record) => record.source === "user")
      .map((record) => buildUserProduct(record, manifest));
  }

  return {
    listProducts: toProfileProducts,

    async getProduct(productId) {
      const products = await toProfileProducts();
      return products.find((product) => product.id === productId) ?? null;
    },

    async createProduct(input) {
      const id = `product-user-${randomUUID().slice(0, 8)}`;
      const record: StoredProduct = {
        id,
        name: input.name,
        category: input.category,
        brand: input.brand,
        modelName: input.modelName,
        sellingPoints: [],
        source: "user",
        createdAt: new Date().toISOString()
      };
      await persist((records) => [...records, record]);
      return buildUserProduct(record, []);
    },

    async updateSellingPoints(productId, points) {
      await persist((records) => {
        const existing = records.find((record) => record.id === productId);
        if (!existing) {
          throw new Error(`Unknown product: ${productId}`);
        }
        return records.map((record) =>
          record.id === productId ? { ...record, sellingPoints: points } : record
        );
      });

      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error(`Unknown product: ${productId}`);
      }
      return product;
    },

    async deleteProduct(productId) {
      const stored = await readStored();
      const record = stored.find((item) => item.id === productId && item.source === "user");
      if (!record) {
        return false;
      }

      // Remove the product's uploaded assets first, then the registry record.
      const manifest = await assetStore.readAssetManifest();
      for (const asset of manifest.filter((item) => item.productId === productId)) {
        await assetStore.removeAsset(asset.id);
      }

      await persist((records) => records.filter((item) => item.id !== productId));
      return true;
    },

    async recognizeSellingPoints(productId) {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error(`Unknown product: ${productId}`);
      }

      // Latest uploaded product-info document wins.
      const documents = product.assets
        .filter((asset) => asset.type === "document" && asset.source === "uploaded")
        .reverse();
      const documentAsset = documents[0];

      if (!documentAsset) {
        throw new Error("未找到产品信息文档,请先在素材库上传产品信息(txt/json)。");
      }

      const file = await assetStore.readAssetBytes(documentAsset.id);
      if (!file) {
        throw new Error("产品信息文档读取失败,请重新上传。");
      }

      // Free-form PDFs go through the language model; txt/json keep rule parsing.
      const isPdf =
        file.contentType === "application/pdf" ||
        documentAsset.filename.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        if (!options.extractPdfSellingPoints) {
          throw new Error("当前环境未配置 PDF 卖点提取器。");
        }
        const extraction = await options.extractPdfSellingPoints(
          file.bytes,
          documentAsset.filename,
          product.displayName
        );
        if (!extraction.sellingPoints.length) {
          throw new Error(extraction.failureReason ?? "PDF 中未识别到卖点。");
        }
        const updated = await this.updateSellingPoints(productId, extraction.sellingPoints);
        return {
          product: updated,
          recognizedFrom: documentAsset.filename,
          model: extraction.model,
          isFallback: extraction.isFallback,
          failureReason: extraction.failureReason
        };
      }

      const points = parseSellingPoints(file.bytes.toString("utf8"));
      if (!points.length) {
        throw new Error(
          "产品信息文档中未识别到卖点,请使用每行“标题|短标签|说明|技术佐证”或 JSON 数组格式。"
        );
      }

      const updated = await this.updateSellingPoints(productId, points);
      return {
        product: updated,
        recognizedFrom: documentAsset.filename,
        model: "rule-parser",
        isFallback: false
      };
    }
  };
}

export function parseSellingPoints(text: string): SellingPoint[] {
  const trimmed = text.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, index) => normalizePoint(
          String(item.title ?? item.name ?? ""),
          String(item.shortLabel ?? item.title ?? item.name ?? ""),
          String(item.benefit ?? item.description ?? ""),
          item.technicalProof ? String(item.technicalProof) : undefined,
          index
        ))
        .filter((point) => point.title.length > 0);
    } catch {
      return [];
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      const [title, shortLabel, benefit, technicalProof] = line
        .split(/[|｜]/)
        .map((part) => part.trim());
      return normalizePoint(title ?? "", shortLabel || title || "", benefit || "", technicalProof, index);
    })
    .filter((point) => point.title.length > 0);
}

function normalizePoint(
  title: string,
  shortLabel: string,
  benefit: string,
  technicalProof: string | undefined,
  index: number
): SellingPoint {
  return {
    id: `feature-recognized-${index + 1}`,
    title,
    shortLabel: shortLabel || title,
    benefit: benefit || title,
    technicalProof: technicalProof || undefined,
    priority: index + 1,
    enabled: true
  };
}

function buildUserProduct(record: StoredProduct, manifest: Asset[]): ProductWithProfile {
  const productAssets = manifest.filter((asset) => asset.productId === record.id);
  return {
    id: record.id,
    projectId: "project-user-workspace",
    category: record.category ?? "User uploaded product",
    brand: record.brand,
    modelName: record.modelName,
    displayName: record.name ?? record.id,
    profileId: `profile-${record.id}`,
    profile: {
      id: `profile-${record.id}`,
      productId: record.id,
      category: record.category ?? "User uploaded product",
      detectedFeatures: record.sellingPoints ?? [],
      localizationHints: [],
      confidence: record.sellingPoints?.length ? 0.9 : 0.5
    },
    assets: productAssets,
    acceptsUserUploads: true
  };
}

export function createDefaultProductRegistry(assetStore: LocalAssetStore): ProductRegistry {
  return createProductRegistry({
    dataDir: join(process.cwd(), "data"),
    assetStore,
    extractPdfSellingPoints: async (pdfBytes, filename, productName) => {
      const { extractSellingPointsFromPdf } = await import(
        "@/src/services/selling-point-extractor"
      );
      return extractSellingPointsFromPdf({ pdfBytes, filename, productName });
    }
  });
}
