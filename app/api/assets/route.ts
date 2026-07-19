import { NextResponse } from "next/server";
import { createDemoAssetStore } from "@/src/services/demo-api";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get("id");

  if (!assetId) {
    return NextResponse.json({ error: "缺少资产 id。" }, { status: 400 });
  }

  const removed = await createDemoAssetStore().removeAsset(assetId);

  if (!removed) {
    return NextResponse.json(
      { error: "资产不存在或为内置示例素材(不可删除)。" },
      { status: 400 }
    );
  }

  return NextResponse.json({ removed: true });
}
