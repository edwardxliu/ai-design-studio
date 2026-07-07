import { describe, expect, it } from "vitest";
import { createImageProvider } from "./image-provider";

describe("createImageProvider", () => {
  it("returns deterministic mock image results in forced mock mode", async () => {
    const provider = createImageProvider({ forceMock: true });

    const result = await provider.generateImage({
      taskId: "task-pop-1",
      prompt: "Generate a POP product scene",
      sourceAssetIds: ["asset-product", "asset-pop"]
    });

    expect(result.url).toBe("/mock/generated/task-pop-1.png");
    expect(result.isFallback).toBe(true);
    expect(result.model).toBe("mock-image-provider");
    expect(result.sourceAssetIds).toEqual(["asset-product", "asset-pop"]);
  });

  it("does not require an API key in mock mode", async () => {
    const provider = createImageProvider({ forceMock: true, apiKey: undefined });

    await expect(
      provider.editImage({
        taskId: "task-edit-1",
        prompt: "Replace a product panel",
        sourceAssetIds: ["asset-product"]
      })
    ).resolves.toMatchObject({
      url: "/mock/generated/task-edit-1.png",
      isFallback: true
    });
  });

  it("falls back to mock mode when no API key is provided", async () => {
    const provider = createImageProvider({ forceMock: false, apiKey: "" });

    const result = await provider.generateImage({
      taskId: "task-no-key",
      prompt: "Generate any product image",
      sourceAssetIds: []
    });

    expect(result.isFallback).toBe(true);
    expect(result.url).toBe("/mock/generated/task-no-key.png");
  });
});

