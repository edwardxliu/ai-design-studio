import { describe, expect, it, vi } from "vitest";
import { generateDemoImage } from "./demo-api";
import type { ImageProvider } from "./image-provider";
import type { LocalAssetStore } from "./local-asset-store";

describe("style transfer image pipeline", () => {
  it("keeps the product first and appends inline style references in declared order", async () => {
    const store: LocalAssetStore = {
      saveUploadedAsset: vi.fn(),
      saveGeneratedImage: vi.fn(),
      readAssetManifest: vi.fn().mockResolvedValue([]),
      readAssetBytes: vi.fn(async (assetId: string) =>
        assetId === "product-image"
          ? { bytes: Buffer.from("product"), contentType: "image/png", filename: "product.png" }
          : null
      ),
      removeAsset: vi.fn(async () => false)
    };
    const editImage = vi.fn(async (input) => ({
      url: "/generated/style.png",
      model: "gpt-image-1",
      prompt: input.prompt,
      sourceAssetIds: input.sourceAssetIds,
      isFallback: false,
      generatedAt: "2026-07-18T12:00:00.000Z"
    }));
    const provider: ImageProvider = { generateImage: vi.fn(), editImage };

    await generateDemoImage({
      taskId: "style-transfer-test",
      prompt: "Image 1 is product; later images are style only.",
      sourceAssetIds: ["product-image"],
      additionalSourceImages: [
        {
          sourceId: "style-reference:ref-1",
          bytes: Buffer.from("style-one"),
          contentType: "image/jpeg",
          filename: "ref-1.jpg"
        },
        {
          sourceId: "style-reference:ref-2",
          bytes: Buffer.from("style-two"),
          contentType: "image/jpeg",
          filename: "ref-2.jpg"
        }
      ],
      imageStore: store,
      provider,
      costLedger: { appendRecord: vi.fn(), readRecords: vi.fn() }
    });

    const providerInput = editImage.mock.calls[0][0];
    expect(providerInput.sourceAssetIds).toEqual([
      "product-image",
      "style-reference:ref-1",
      "style-reference:ref-2"
    ]);
    expect(providerInput.sourceImages?.map((image: { bytes: Buffer }) => image.bytes.toString())).toEqual([
      "product",
      "style-one",
      "style-two"
    ]);
  });
});
