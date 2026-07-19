import { NextResponse } from "next/server";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { createDefaultProductRegistry } from "@/src/services/product-registry";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "");

  if (!productId) {
    return NextResponse.json({ error: "缺少 productId。" }, { status: 400 });
  }

  try {
    const registry = createDefaultProductRegistry(createDemoAssetStore());
    const result = await registry.recognizeSellingPoints(productId);

    // LLM PDF extraction costs one text-model call; rule parsing is free.
    const usedLlm = Boolean(result.model && result.model !== "rule-parser");
    await createDefaultCostLedger().appendRecord({
      taskId: `recognize-${productId}-${Date.now()}`,
      task: "Selling-point extraction",
      model: result.model ?? "rule-parser",
      mode: usedLlm ? "openai" : "deterministic",
      country: "-",
      language: "-",
      estimatedUnits: usedLlm ? 1 : 0,
      isFallback: false,
      sourceAssetIds: result.recognizedFrom ? [result.recognizedFrom] : []
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "识别卖点失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
