import { NextResponse } from "next/server";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import {
  buildStyleTransferPrompt,
  getStyleTransferPreset,
  getStyleTransferVariant,
  isStyleTransferStyleId,
  isStyleTransferVariantId
} from "@/src/domain/style-transfer";
import type { Asset } from "@/src/domain/types";
import { createDemoAssetStore, generateDemoImage } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";
import { loadStyleTransferReferences } from "@/src/services/style-transfer";
import { createDefaultSystemSettingsStore } from "@/src/services/system-settings";

const SUPPORTED_PRODUCT_TYPES = new Set<Asset["type"]>([
  "product-photo",
  "phone-shot",
  "white-background-closed",
  "white-background-open",
  "sku-product"
]);
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_KEYWORDS_LENGTH = 600;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  const productAssetId = String(body?.productAssetId ?? "").trim();
  const keywords = String(body?.keywords ?? "").trim();
  const styleId = body?.styleId;
  const variantId = body?.variantId;
  const imageModel = parseImageModelChoice(body?.imageModel);

  if (
    !productId ||
    !productAssetId ||
    !isStyleTransferStyleId(styleId) ||
    !isStyleTransferVariantId(variantId)
  ) {
    return NextResponse.json(
      { error: "请选择产品、产品图、风格和输出构图。" },
      { status: 400 }
    );
  }
  if (keywords.length > MAX_KEYWORDS_LENGTH) {
    return NextResponse.json(
      { error: `Keywords 不能超过 ${MAX_KEYWORDS_LENGTH} 个字符。` },
      { status: 400 }
    );
  }

  const imageStore = createDemoAssetStore();
  const product = await createDefaultProductRegistry(imageStore).getProduct(productId);
  if (!product) {
    return NextResponse.json(
      { error: "产品不存在，请先在素材库创建产品。" },
      { status: 400 }
    );
  }

  const productAsset = product.assets.find((asset) => asset.id === productAssetId);
  if (!productAsset || !SUPPORTED_PRODUCT_TYPES.has(productAsset.type)) {
    return NextResponse.json(
      { error: "所选产品图不属于当前产品，或不是可用于风格迁移的产品图片。" },
      { status: 400 }
    );
  }

  const productFile = await imageStore.readAssetBytes(productAsset.id);
  if (!productFile || !SUPPORTED_IMAGE_TYPES.has(productFile.contentType)) {
    return NextResponse.json(
      { error: "产品图片文件不存在，或不是受支持的 PNG、JPEG、WebP 图片。" },
      { status: 400 }
    );
  }

  try {
    const preset = getStyleTransferPreset(styleId);
    const variant = getStyleTransferVariant(variantId);
    const styleReferences = await loadStyleTransferReferences(styleId);
    const settings = await createDefaultSystemSettingsStore().read();
    const taskId = `style-transfer-${styleId}-${variantId}-${Date.now()}`;
    const prompt = buildStyleTransferPrompt({
      preset,
      variantId,
      keywords,
      productName: product.displayName ?? product.modelName ?? "the uploaded product"
    });

    const result = await generateDemoImage({
      taskId,
      taskLabel: `风格迁移 / ${preset.label} / ${variant.label}`,
      prompt,
      sourceAssetIds: [productAsset.id],
      additionalSourceImages: styleReferences,
      country: settings.country,
      language: settings.language,
      imageModel,
      size: "1536x1024",
      imageStore
    });

    return NextResponse.json({
      style: { id: preset.id, label: preset.label },
      variant: { id: variant.id, label: variant.label },
      output: {
        id: taskId,
        url: result.url,
        model: result.model,
        prompt: result.prompt,
        sourceAssetIds: result.sourceAssetIds,
        generatedAt: result.generatedAt,
        isFallback: result.isFallback
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "风格场景图片生成失败。" },
      { status: 502 }
    );
  }
}
