import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseWhiteBackgroundRequest, validateWhiteBackgroundReferences } from "@/src/domain/white-background";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { renderWhiteBackgroundOutput } from "@/src/services/white-background";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  let input;
  try { input = parseWhiteBackgroundRequest(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof ZodError ? "请选择1–3张产品参考图、有效角度和256–4096px的整数尺寸，并检查背景选项。" : "请求内容无效。" }, { status: 400 }); }
  const imageStore = createDemoAssetStore();
  const product = await createDefaultProductRegistry(imageStore).getProduct(input.productId);
  if (!product) return NextResponse.json({ error: "当前产品不存在，请先在素材库创建产品。" }, { status: 400 });
  try { validateWhiteBackgroundReferences(input, product.assets); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "参考图无效。" }, { status: 400 }); }
  try {
    const output = await renderWhiteBackgroundOutput(input, { imageStore, costLedger: createDefaultCostLedger() });
    return NextResponse.json({ output });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "生成失败，请重试。" }, { status: 502 }); }
}
