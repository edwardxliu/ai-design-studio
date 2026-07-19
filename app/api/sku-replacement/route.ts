import { NextResponse } from "next/server";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import {
  buildSkuReplacementPrompt,
  isSkuReplacementMode
} from "@/src/domain/sku-replacement";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { generateDemoImage, createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";
import { createDefaultSystemSettingsStore } from "@/src/services/system-settings";

const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  const baseAssetId = String(body?.baseAssetId ?? "").trim();
  const referenceAssetId = String(body?.referenceAssetId ?? "").trim();
  const maskAssetId = String(body?.maskAssetId ?? "").trim();
  const instruction = String(body?.instruction ?? "").trim();
  const selectionDescription = String(body?.selectionDescription ?? "").trim();
  const mode = body?.mode;
  const imageModel = parseImageModelChoice(body?.imageModel);

  if (!productId || !baseAssetId || !isSkuReplacementMode(mode)) {
    return NextResponse.json({ error: "请选择产品、产品图和局部替换方式。" }, { status: 400 });
  }
  if (!instruction) {
    return NextResponse.json({ error: "请填写局部替换要求。" }, { status: 400 });
  }
  if (mode === "reference-part" && !referenceAssetId) {
    return NextResponse.json({ error: "参考图部件替换必须同时上传产品图和新部件图。" }, { status: 400 });
  }
  if (mode !== "reference-part" && !maskAssetId) {
    return NextResponse.json({ error: "颜色或样式替换必须先在画布中选择部件区域。" }, { status: 400 });
  }

  const imageStore = createDemoAssetStore();
  const product = await createDefaultProductRegistry(imageStore).getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "产品不存在，请先在产品档案中创建产品。" }, { status: 400 });
  }

  const baseAsset = findProductAsset(product, baseAssetId);
  const referenceAsset = referenceAssetId
    ? findProductAsset(product, referenceAssetId)
    : undefined;
  const maskAsset = maskAssetId ? findProductAsset(product, maskAssetId) : undefined;
  if (!baseAsset || !isBaseProductImage(baseAsset)) {
    return NextResponse.json({ error: "产品图不属于当前产品、类型不正确或已被删除。" }, { status: 400 });
  }
  if (
    mode === "reference-part" &&
    (!referenceAsset || referenceAsset.type !== "sku-reference-part")
  ) {
    return NextResponse.json({ error: "新部件图不属于当前产品、类型不正确或已被删除。" }, { status: 400 });
  }
  if (mode !== "reference-part" && (!maskAsset || maskAsset.type !== "sku-mask")) {
    return NextResponse.json({ error: "选区蒙版不属于当前产品、类型不正确或已被删除。" }, { status: 400 });
  }

  const baseFile = await imageStore.readAssetBytes(baseAsset.id);
  if (!baseFile || !SUPPORTED_IMAGE_TYPES.has(baseFile.contentType)) {
    return NextResponse.json({ error: "产品图文件不存在或不是受支持的 PNG、JPEG、WebP 图片。" }, { status: 400 });
  }
  if (referenceAsset) {
    const referenceFile = await imageStore.readAssetBytes(referenceAsset.id);
    if (!referenceFile || !SUPPORTED_IMAGE_TYPES.has(referenceFile.contentType)) {
      return NextResponse.json({ error: "新部件图文件不存在或不是受支持的 PNG、JPEG、WebP 图片。" }, { status: 400 });
    }
  }
  if (maskAsset) {
    const maskFile = await imageStore.readAssetBytes(maskAsset.id);
    if (!maskFile || maskFile.contentType !== "image/png") {
      return NextResponse.json({ error: "选区蒙版必须是带透明通道的 PNG 图片。" }, { status: 400 });
    }
  }

  try {
    const settings = await createDefaultSystemSettingsStore().read();
    const taskId = `sku-${mode}-${Date.now()}`;
    const sourceAssetIds = [baseAsset.id, ...(referenceAsset ? [referenceAsset.id] : [])];
    const prompt = buildSkuReplacementPrompt({
      mode,
      instruction,
      selectionDescription,
      maskAsReference: imageModel === "doubao"
    });
    const result = await generateDemoImage({
      taskId,
      taskLabel: `SKU 局部替换 / ${mode}`,
      prompt,
      sourceAssetIds,
      ...(maskAsset ? { maskAssetId: maskAsset.id } : {}),
      country: settings.country,
      language: settings.language,
      imageModel,
      imageStore
    });

    return NextResponse.json({
      output: {
        id: taskId,
        mode,
        url: result.url,
        model: result.model,
        prompt: result.prompt,
        sourceAssetIds: result.sourceAssetIds,
        generatedAt: result.generatedAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SKU 局部替换生成失败。" },
      { status: 502 }
    );
  }
}

function findProductAsset(product: ProductWithProfile, assetId: string): Asset | undefined {
  return product.assets.find((asset) => asset.id === assetId);
}

function isBaseProductImage(asset: Asset): boolean {
  return asset.type === "sku-product" || asset.type === "product-photo" || asset.type === "phone-shot";
}
