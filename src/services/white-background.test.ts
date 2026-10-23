// @vitest-environment node
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { renderWhiteBackgroundOutput, padWhiteBackgroundImage } from "./white-background";
import { parseWhiteBackgroundRequest } from "@/src/domain/white-background";
import type { LocalAssetStore } from "./local-asset-store";
import type { ImageProvider, ImageProviderInput } from "./image-provider";

const request = parseWhiteBackgroundRequest({ productId: "p", referenceAssetIds: ["a", "b"], angle: "top", sourceState: "as-reference", autoRemoveBackground: true, whiteBackground: true, naturalShadow: true, width: 1920, height: 1080, imageModel: "doubao" });
const redSquare = () => sharp({ create: { width: 100, height: 100, channels: 3, background: "red" } }).png().toBuffer();
function createTestStore(overrides: Partial<LocalAssetStore>): LocalAssetStore {
  return {
    saveUploadedAsset: async () => { throw new Error("Unexpected source upload during generation"); },
    saveGeneratedImage: async () => { throw new Error("Unexpected generated output save"); },
    readAssetManifest: async () => [],
    readAssetBytes: async () => null,
    removeAsset: async () => { throw new Error("Generation must not remove source assets"); },
    ...overrides
  };
}
describe("white background image generation", () => {
  it("flattens transparent provider pixels onto white only when white background is selected", async () => {
    const transparent = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const white = await padWhiteBackgroundImage(transparent, { width: 2, height: 2 }, true);
    expect(await sharp(white).raw().toBuffer()).toEqual(Buffer.from([255,255,255,255,255,255,255,255,255,255,255,255]));
    const retained = await padWhiteBackgroundImage(transparent, { width: 2, height: 2 }, false);
    expect((await sharp(retained).metadata()).hasAlpha).toBe(true);
  });
  it("fits the generated image without distortion or crop and pads to exact output size", async () => {
    const output = await padWhiteBackgroundImage(await redSquare(), { width: 200, height: 100 }, true);
    const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([200, 100]);
    const pixel = (x: number) => [...data.subarray((50 * info.width + x) * info.channels, (50 * info.width + x) * info.channels + 3)];
    expect(pixel(0)).toEqual([255, 255, 255]); expect(pixel(50)).toEqual([255, 0, 0]); expect(pixel(149)).toEqual([255, 0, 0]); expect(pixel(199)).toEqual([255, 255, 255]);
  });
  it("sends every resolved reference and processing instruction, then stores exact-size PNG", async () => {
    const bytes = await redSquare(); let savedBytes: Buffer | undefined;
    const store = createTestStore({ readAssetBytes: async (id) => ({ bytes, contentType: "image/png", filename: `${id}.png` }), saveGeneratedImage: async (input) => { savedBytes = input.bytes; return { id: "saved", url: "/generated/exact.png", filePath: "exact.png" }; } });
    const provider: ImageProvider = { generateImage: vi.fn(), editImage: vi.fn(async (input: ImageProviderInput) => {
      expect(input.size).toBe("1536x1024"); expect(input.sourceImages?.map((i) => i.filename)).toEqual(["a.png", "b.png"]);
      expect(input.prompt).toContain("俯视"); expect(input.prompt).toContain("#FFFFFF");
      return { url: `data:image/png;base64,${bytes.toString("base64")}`, model: "fake", prompt: input.prompt, sourceAssetIds: input.sourceAssetIds, generatedAt: "now", isFallback: false };
    }) };
    const output = await renderWhiteBackgroundOutput(request, { imageStore: store, provider });
    expect(output).toMatchObject({ url: "/generated/exact.png", width: 1920, height: 1080, sourceAssetIds: ["a", "b"], angle: "top" });
    expect(await sharp(savedBytes).metadata()).toMatchObject({ width: 1920, height: 1080, format: "png" });
  });
  it("fails before a paid call if any selected reference cannot be read", async () => {
    const provider = { generateImage: vi.fn(), editImage: vi.fn() };
    await expect(renderWhiteBackgroundOutput(request, { imageStore: createTestStore({}), provider })).rejects.toThrow(/参考图/);
    expect(provider.editImage).not.toHaveBeenCalled();
  });
});
