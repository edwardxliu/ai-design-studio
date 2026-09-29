import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  localizeGeneratedImage: vi.fn(),
  readImageDimensions: vi.fn(),
  resizeImageToExactDimensions: vi.fn(),
  saveGeneratedImage: vi.fn()
}));

vi.mock("@/src/services/demo-api", () => ({
  createDemoAssetStore: () => ({ saveGeneratedImage: mocks.saveGeneratedImage }),
  localizeGeneratedImage: mocks.localizeGeneratedImage
}));

vi.mock("@/src/services/cost-ledger", () => ({
  createDefaultCostLedger: () => ({ appendRecord: vi.fn() })
}));

vi.mock("@/src/services/image-dimensions", () => ({
  chooseImageProviderSize: () => "1536x1024",
  readImageDimensions: mocks.readImageDimensions,
  resizeImageToExactDimensions: mocks.resizeImageToExactDimensions
}));

import { POST } from "./route";

beforeEach(() => {
  mocks.localizeGeneratedImage.mockReset().mockResolvedValue({
    model: "gpt-image-1",
    sourceUrl: "upload:creative.png",
    url: "data:image/png;base64,b3V0cHV0"
  });
  mocks.readImageDimensions.mockReset().mockResolvedValue({ width: 1600, height: 900 });
  mocks.resizeImageToExactDimensions.mockReset().mockResolvedValue(Buffer.from("resized"));
  mocks.saveGeneratedImage.mockReset().mockResolvedValue({
    id: "localized-output",
    url: "/generated/localized-output.png",
    filePath: "localized-output.png"
  });
});

function createUploadedFile(name: string, type: string, content: string): File {
  const bytes = new TextEncoder().encode(content);
  return {
    arrayBuffer: async () => bytes.buffer,
    name,
    type
  } as File;
}

function createUploadRequest(
  image: File,
  fields: Record<string, string> = {}
): Request {
  const values = new Map<string, FormDataEntryValue>([["image", image]]);
  for (const [key, value] of Object.entries(fields)) {
    values.set(key, value);
  }
  return {
    formData: async () => ({
      get: (key: string) => values.get(key) ?? null
    })
  } as unknown as Request;
}

describe("localize route", () => {
  it("accepts a user upload and preserves its source dimensions", async () => {
    const response = await POST(
      createUploadRequest(
        createUploadedFile("creative.png", "image/png", "pixels"),
        {
          country: "Saudi Arabia",
          imageModel: "doubao",
          language: "Arabic"
        }
      )
    );

    expect(response.status).toBe(200);
    expect(mocks.localizeGeneratedImage).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/png",
        country: "Saudi Arabia",
        imageModel: "doubao",
        language: "Arabic",
        size: "1536x1024",
        sourceHeight: 900,
        sourceUrl: "upload:creative.png",
        sourceWidth: 1600
      })
    );
    expect(mocks.resizeImageToExactDimensions).toHaveBeenCalledWith(
      Buffer.from("output"),
      { width: 1600, height: 900 }
    );
    await expect(response.json()).resolves.toMatchObject({
      height: 900,
      sourceUrl: "upload:creative.png",
      url: "/generated/localized-output.png",
      width: 1600
    });
  });

  it("rejects server-side SVG parsing before image metadata is read", async () => {
    const response = await POST(
      createUploadRequest(
        createUploadedFile("oversized.svg", "image/svg+xml", "<svg/>")
      )
    );

    expect(response.status).toBe(415);
    expect(mocks.readImageDimensions).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("SVG")
    });
  });
});
