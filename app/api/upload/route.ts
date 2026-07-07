import { NextResponse } from "next/server";
import { createDefaultLocalAssetStore } from "@/src/services/local-asset-store";
import type { AssetType } from "@/src/domain/types";

const allowedAssetTypes = new Set<AssetType>([
  "product-photo",
  "phone-shot",
  "brand-guide",
  "template-reference",
  "feature-icon",
  "background",
  "pop-input",
  "pdp-input",
  "document"
]);

export async function POST(request: Request) {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "demo-project");
  const productId = String(form.get("productId") ?? "uploaded-product");
  const requestedType = String(form.get("type") ?? "product-photo") as AssetType;
  const type = allowedAssetTypes.has(requestedType) ? requestedType : "product-photo";
  const files = form.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ assets: [], error: "No files uploaded." }, { status: 400 });
  }

  const store = createDefaultLocalAssetStore();
  const assets = await Promise.all(
    files.map(async (file) =>
      store.saveUploadedAsset({
        projectId,
        productId,
        type,
        filename: file.name,
        contentType: file.type,
        bytes: Buffer.from(await file.arrayBuffer())
      })
    )
  );

  return NextResponse.json({ assets });
}
