import { NextResponse } from "next/server";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";

export async function GET() {
  const registry = createDefaultProductRegistry(createDemoAssetStore());
  return NextResponse.json({ products: await registry.listProducts() });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("id");

  if (!productId) {
    return NextResponse.json({ error: "缺少产品 id。" }, { status: 400 });
  }

  const registry = createDefaultProductRegistry(createDemoAssetStore());
  const removed = await registry.deleteProduct(productId);

  if (!removed) {
    return NextResponse.json(
      { error: "产品不存在或已被删除。" },
      { status: 400 }
    );
  }

  return NextResponse.json({ removed: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const category = String(body?.category ?? "").trim();

  if (!name || !category) {
    return NextResponse.json({ error: "产品名称和品类不能为空。" }, { status: 400 });
  }

  const registry = createDefaultProductRegistry(createDemoAssetStore());
  const product = await registry.createProduct({
    name,
    category,
    brand: body?.brand ? String(body.brand) : undefined,
    modelName: body?.modelName ? String(body.modelName) : undefined
  });

  return NextResponse.json({ product });
}
