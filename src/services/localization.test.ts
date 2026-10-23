import { describe, expect, it, vi } from "vitest";
import { localizeGeneratedImage } from "./demo-api";

describe("localization clean base", () => {
  it("keeps original text reference first and clean layout second with explicit roles", async () => {
    const editImage = vi.fn().mockResolvedValue({ url: "/generated/result.png", model: "test", prompt: "", sourceAssetIds: [], isFallback: false, generatedAt: "now" });
    await localizeGeneratedImage({ taskId: "localize", sourceUrl: "upload:original.png", imageBytes: Buffer.from("original"), contentType: "image/png", baseImageBytes: Buffer.from("clean"), baseImageContentType: "image/webp", country: "Mexico", language: "Spanish", provider: { editImage, generateImage: vi.fn() } });
    const request = editImage.mock.calls[0][0];
    expect(request.sourceImages.map((image: { bytes: Buffer }) => image.bytes.toString())).toEqual(["original", "clean"]);
    expect(request.prompt).toMatch(/Image 1.*text/i);
    expect(request.prompt).toMatch(/Image 2.*clean/i);
    expect(request.prompt).toContain("Spanish");
  });
});
