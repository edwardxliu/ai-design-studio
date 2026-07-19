import { NextResponse } from "next/server";
import type { SellingPoint } from "@/src/domain/types";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "");

  if (!productId || !Array.isArray(body?.sellingPoints)) {
    return NextResponse.json({ error: "缺少 productId 或 sellingPoints。" }, { status: 400 });
  }

  const points: SellingPoint[] = body.sellingPoints
    .filter((item: unknown): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item: Record<string, unknown>, index: number) => ({
      id: String(item.id ?? `feature-manual-${index + 1}`),
      title: String(item.title ?? ""),
      shortLabel: String(item.shortLabel ?? item.title ?? ""),
      benefit: String(item.benefit ?? ""),
      technicalProof: item.technicalProof ? String(item.technicalProof) : undefined,
      priority: Number(item.priority ?? index + 1),
      enabled: item.enabled === false ? false : true
    }))
    .filter((point: SellingPoint) => point.title.length > 0);

  try {
    const registry = createDefaultProductRegistry(createDemoAssetStore());
    const product = await registry.updateSellingPoints(productId, points);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新卖点失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
