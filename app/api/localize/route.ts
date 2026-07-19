import { join } from "node:path";
import { NextResponse } from "next/server";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import { createDemoAssetStore, localizeGeneratedImage } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { readRuntimeFile } from "@/src/services/runtime-files";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const outputUrl = String(body?.outputUrl ?? "");

  if (!outputUrl.startsWith("/generated/")) {
    return NextResponse.json({ error: "请选择一张已生成的图片。" }, { status: 400 });
  }

  const segments = outputUrl.replace("/generated/", "").split("/");
  const file = await readRuntimeFile(join(process.cwd(), "public", "generated"), segments);

  if (!file) {
    return NextResponse.json({ error: "所选图片不存在,可能已被清理。" }, { status: 400 });
  }

  const suppliedImage = parseSuppliedImage(body);
  if (!suppliedImage && !["image/png", "image/jpeg", "image/webp"].includes(file.contentType)) {
    return NextResponse.json(
      { error: "SVG 输出需要先在浏览器中栅格化后再转换。" },
      { status: 400 }
    );
  }

  const result = await localizeGeneratedImage({
    taskId: `localize-${Date.now()}`,
    sourceUrl: outputUrl,
    imageBytes: suppliedImage?.bytes ?? file.bytes,
    contentType: suppliedImage?.contentType ?? file.contentType,
    country: String(body?.country ?? "Mexico"),
    language: String(body?.language ?? "Spanish"),
    size: parseSize(body?.size),
    imageModel: parseImageModelChoice(body?.imageModel),
    imageStore: createDemoAssetStore(),
    costLedger: createDefaultCostLedger()
  });

  return NextResponse.json(result);
}

function parseSuppliedImage(body: unknown): { bytes: Buffer; contentType: string } | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.imageBase64 !== "string" || record.imageBase64.length === 0) {
    return undefined;
  }
  const contentType = String(record.imageContentType ?? "");
  if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
    return undefined;
  }
  const bytes = Buffer.from(record.imageBase64, "base64");
  if (bytes.length === 0 || bytes.length > 30 * 1024 * 1024) {
    return undefined;
  }
  return { bytes, contentType };
}

function parseSize(value: unknown): "1024x1024" | "1536x1024" | "1024x1536" | undefined {
  return value === "1024x1024" || value === "1536x1024" || value === "1024x1536"
    ? value
    : undefined;
}