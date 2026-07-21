import { writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { NextResponse } from "next/server";
import { parseImageModelChoice } from "@/src/domain/generation-models";
import { createDemoAssetStore, localizeGeneratedImage } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import {
  chooseImageProviderSize,
  readImageDimensions,
  resizeImageToExactDimensions,
  type PixelDimensions
} from "@/src/services/image-dimensions";
import { createProxyDispatcher, fetchOpenAi } from "@/src/services/image-provider";
import type { LocalAssetStore } from "@/src/services/local-asset-store";
import { readRuntimeFile } from "@/src/services/runtime-files";

const GENERATED_ROOT = join(process.cwd(), "public", "generated");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const outputUrl = String(body?.outputUrl ?? "");

  if (!outputUrl.startsWith("/generated/")) {
    return NextResponse.json({ error: "请选择一张已生成的图片。" }, { status: 400 });
  }

  const segments = outputUrl.replace("/generated/", "").split("/");
  const file = await readRuntimeFile(GENERATED_ROOT, segments);
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

  let dimensions: PixelDimensions;
  try {
    dimensions = await readImageDimensions(file.bytes);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "无法读取原图尺寸。" },
      { status: 400 }
    );
  }

  const taskId = `localize-${Date.now()}`;
  const imageStore = createDemoAssetStore();
  try {
    const result = await localizeGeneratedImage({
      taskId,
      sourceUrl: outputUrl,
      imageBytes: suppliedImage?.bytes ?? file.bytes,
      contentType: suppliedImage?.contentType ?? file.contentType,
      country: String(body?.country ?? "Mexico"),
      language: String(body?.language ?? "Spanish"),
      size: chooseImageProviderSize(dimensions),
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height,
      imageModel: parseImageModelChoice(body?.imageModel),
      imageStore,
      costLedger: createDefaultCostLedger()
    });
    const exactUrl = await conformOutputDimensions(
      result.url,
      dimensions,
      taskId,
      imageStore
    );

    return NextResponse.json({
      ...result,
      url: exactUrl,
      width: dimensions.width,
      height: dimensions.height
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "本地化图片生成失败。" },
      { status: 502 }
    );
  }
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

async function conformOutputDimensions(
  outputUrl: string,
  dimensions: PixelDimensions,
  taskId: string,
  imageStore: LocalAssetStore
): Promise<string> {
  const generatedBytes = await readGeneratedOutputBytes(outputUrl);
  const resized = await resizeImageToExactDimensions(generatedBytes, dimensions);

  if (outputUrl.startsWith("/generated/") && extname(outputUrl).toLowerCase() === ".png") {
    const target = resolveGeneratedPath(outputUrl);
    await writeFile(target, resized);
    return outputUrl;
  }

  const saved = await imageStore.saveGeneratedImage({
    taskId,
    filename: "localized-original-size.png",
    contentType: "image/png",
    bytes: resized
  });
  return saved.url;
}

async function readGeneratedOutputBytes(outputUrl: string): Promise<Buffer> {
  if (outputUrl.startsWith("/generated/")) {
    const file = await readRuntimeFile(
      GENERATED_ROOT,
      outputUrl.replace("/generated/", "").split("/")
    );
    if (!file) {
      throw new Error("无法读取本地化模型输出。" );
    }
    return file.bytes;
  }

  const dataMatch = outputUrl.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
  if (dataMatch) {
    return Buffer.from(dataMatch[1], "base64");
  }

  if (!/^https?:\/\//i.test(outputUrl)) {
    throw new Error("本地化模型返回了不支持的图片地址。" );
  }
  const response = await fetchOpenAi(
    outputUrl,
    { method: "GET" },
    createProxyDispatcher(process.env.ARK_PROXY_URL ?? process.env.OPENAI_PROXY_URL)
  );
  if (!response.ok) {
    throw new Error(`本地化结果下载失败：HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function resolveGeneratedPath(outputUrl: string): string {
  const root = resolve(GENERATED_ROOT);
  const target = resolve(root, ...outputUrl.replace("/generated/", "").split("/"));
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error("本地化输出路径不安全。" );
  }
  return target;
}