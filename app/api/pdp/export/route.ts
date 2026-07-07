import { NextResponse } from "next/server";
import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { renderPdpSvg } from "@/src/domain/pdp-export";
import { buildDemoPdp } from "@/src/services/demo-api";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { createDefaultLocalAssetStore } from "@/src/services/local-asset-store";

export async function POST(request: Request) {
  const body = await request.json();
  const country = String(body.country ?? "Mexico");
  const language = String(body.language ?? "Spanish");
  const taskId = String(body.taskId ?? `task-pdp-export-${Date.now()}`);
  const product = getPrimaryDemoProduct();
  const document = buildDemoPdp({ country, language });
  const svg = renderPdpSvg(document, product.displayName ?? "Uploaded product");
  const store = createDefaultLocalAssetStore();
  const saved = await store.saveGeneratedImage({
    taskId,
    filename: `${document.id}.svg`,
    contentType: "image/svg+xml",
    bytes: Buffer.from(svg, "utf8")
  });

  await createDefaultCostLedger().appendRecord({
    taskId,
    task: "PDP long image export",
    model: "template-engine",
    mode: "deterministic",
    country,
    language,
    estimatedUnits: 0,
    isFallback: false,
    sourceAssetIds: [
      document.cover.imageAssetId,
      ...document.sections.map((section) => section.largeImageAssetId ?? section.sellingPointId)
    ]
  });

  return NextResponse.json({
    taskId,
    url: saved.url,
    templateVersion: document.templateVersion,
    sectionCount: document.sections.length,
    isFallback: false
  });
}
