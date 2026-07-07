import { NextResponse } from "next/server";
import { generateDemoPopScene } from "@/src/services/demo-api";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await generateDemoPopScene({
    taskId: String(body.taskId ?? "task-pop-scene"),
    productName: String(body.productName ?? "Uploaded product"),
    placement: String(body.placement ?? "front panel"),
    flatPopAssetId: String(body.flatPopAssetId ?? "pop-flat-render"),
    forceMock: body.forceMock
  });

  return NextResponse.json(result);
}

