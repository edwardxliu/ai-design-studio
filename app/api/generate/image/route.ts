import { NextResponse } from "next/server";
import { generateDemoImage } from "@/src/services/demo-api";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await generateDemoImage({
    taskId: String(body.taskId ?? "task-image"),
    prompt: String(body.prompt ?? "Generate a product image"),
    sourceAssetIds: Array.isArray(body.sourceAssetIds) ? body.sourceAssetIds : [],
    forceMock: body.forceMock
  });

  return NextResponse.json(result);
}

