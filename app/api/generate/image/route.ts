import { NextResponse } from "next/server";
import { generateDemoImage } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { createDefaultLocalAssetStore } from "@/src/services/local-asset-store";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await generateDemoImage({
    taskId: String(body.taskId ?? "task-image"),
    taskLabel: String(body.taskLabel ?? "Image generation"),
    prompt: String(body.prompt ?? "Generate a product image"),
    sourceAssetIds: Array.isArray(body.sourceAssetIds) ? body.sourceAssetIds.map(String) : [],
    country: String(body.country ?? "Mexico"),
    language: String(body.language ?? "Spanish"),
    forceMock: body.forceMock,
    imageStore: createDefaultLocalAssetStore(),
    costLedger: createDefaultCostLedger()
  });

  return NextResponse.json(result);
}
