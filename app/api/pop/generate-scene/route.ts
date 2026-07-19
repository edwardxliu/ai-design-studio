import { NextResponse } from "next/server";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import { createDemoAssetStore, generatePopTemplateScene } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { createDefaultProductRegistry } from "@/src/services/product-registry";
import { createDefaultSystemSettingsStore } from "@/src/services/system-settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.templateId) {
    return NextResponse.json({ error: "缺少 templateId。" }, { status: 400 });
  }

  const imageStore = createDemoAssetStore();
  const product = body.productId
    ? await createDefaultProductRegistry(imageStore).getProduct(String(body.productId))
    : null;

  if (!product) {
    return NextResponse.json(
      { error: "请先在素材库创建产品并上传素材,再生成 POP。" },
      { status: 400 }
    );
  }

  try {
    const settings = await createDefaultSystemSettingsStore().read();
    const result = await generatePopTemplateScene({
      taskId: String(body.taskId ?? `task-pop-${Date.now()}`),
      templateId: String(body.templateId),
      product,
      productAssetId: body.productAssetId ? String(body.productAssetId) : undefined,
      placement: String(body.placement ?? "front panel"),
      country: settings.country,
      language: settings.language,
      textValues: isRecordOfStrings(body.textValues) ? body.textValues : {},
      imageAssetIds: isRecordOfStrings(body.imageAssetIds) ? body.imageAssetIds : {},
      popImageBase64: body.popImageBase64 ? String(body.popImageBase64) : undefined,
      imageModel: parseImageModelChoice(body.imageModel),
      imageStore,
      costLedger: createDefaultCostLedger()
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "POP scene generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}
