import { NextResponse } from "next/server";
import {
  buildIconDesignPrompt,
  DEFAULT_ICON_VI_PROMPT_TEMPLATE,
  getIconDesignVariant,
  isIconDesignVariantId
} from "@/src/domain/icon-design";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import type { Asset, AssetType } from "@/src/domain/types";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { createDemoAssetStore, generateDemoImage } from "@/src/services/demo-api";
import { createDefaultSystemSettingsStore } from "@/src/services/system-settings";

const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const variantId = body?.variantId;
  const viColorAssetId = String(body?.viColorAssetId ?? "").trim();
  const viStyleAssetId = String(body?.viStyleAssetId ?? "").trim();
  const sourceIconAssetId = String(body?.sourceIconAssetId ?? "").trim();
  const featureTitle = String(body?.featureTitle ?? "").trim();
  const promptTemplate =
    String(body?.promptTemplate ?? "").trim() || DEFAULT_ICON_VI_PROMPT_TEMPLATE;
  const imageModel = parseImageModelChoice(body?.imageModel);

  if (!isIconDesignVariantId(variantId)) {
    return NextResponse.json({ error: "Icon Design 输出规格不正确。" }, { status: 400 });
  }
  if (!viColorAssetId || !viStyleAssetId || !sourceIconAssetId) {
    return NextResponse.json(
      { error: "品牌色彩 VI、Icon 设计 VI 和源 Icon 三张参考图缺一不可。" },
      { status: 400 }
    );
  }
  if (!featureTitle) {
    return NextResponse.json({ error: "请填写卖点标题。" }, { status: 400 });
  }

  const imageStore = createDemoAssetStore();
  const assets = await imageStore.readAssetManifest();
  const references = [
    findTypedAsset(assets, viColorAssetId, "icon-vi-color"),
    findTypedAsset(assets, viStyleAssetId, "icon-vi-style"),
    findTypedAsset(assets, sourceIconAssetId, "icon-source")
  ];
  if (references.some((asset) => !asset)) {
    return NextResponse.json(
      { error: "参考素材不存在、类型不正确或已被删除。" },
      { status: 400 }
    );
  }

  for (const asset of references as Asset[]) {
    const file = await imageStore.readAssetBytes(asset.id);
    if (!file || !SUPPORTED_IMAGE_TYPES.has(file.contentType)) {
      return NextResponse.json(
        { error: `${asset.filename} 不是受支持的 PNG、JPEG 或 WebP 图片。` },
        { status: 400 }
      );
    }
  }

  try {
    const variant = getIconDesignVariant(variantId);
    const settings = await createDefaultSystemSettingsStore().read();
    const taskId = `icon-design-${variant.id}-${Date.now()}`;
    const prompt = buildIconDesignPrompt({ template: promptTemplate, featureTitle, variantId });
    const result = await generateDemoImage({
      taskId,
      taskLabel: `Icon Design / ${variant.label}`,
      prompt,
      sourceAssetIds: [viColorAssetId, viStyleAssetId, sourceIconAssetId],
      country: settings.country,
      language: settings.language,
      imageModel,
      size: variant.size,
      imageStore,
      costLedger: createDefaultCostLedger()
    });

    return NextResponse.json({
      output: {
        id: taskId,
        variantId: variant.id,
        label: variant.label,
        group: variant.group,
        size: variant.size,
        url: result.url,
        model: result.model,
        prompt: result.prompt,
        sourceAssetIds: result.sourceAssetIds,
        generatedAt: result.generatedAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Icon Design 生成失败。" },
      { status: 502 }
    );
  }
}

function findTypedAsset(assets: Asset[], id: string, type: AssetType): Asset | undefined {
  return assets.find((asset) => asset.id === id && asset.type === type);
}