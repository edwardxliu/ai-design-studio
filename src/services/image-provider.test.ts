import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createImageProvider } from "./image-provider";
import { createLocalAssetStore } from "./local-asset-store";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

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

  it("persists base64 OpenAI image results to the generated asset directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-generated-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });
    const generate = vi.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("real generated image").toString("base64") }]
    });

    const provider = createImageProvider({
      forceMock: false,
      apiKey: "test-key",
      model: "gpt-image-2",
      imageStore: store,
      clientFactory: () => ({ images: { generate } })
    });

    const result = await provider.generateImage({
      taskId: "task-real-image",
      prompt: "Generate a product hero image",
      sourceAssetIds: ["asset-product"]
    });

    expect(generate).toHaveBeenCalledWith({
      model: "gpt-image-2",
      prompt: "Generate a product hero image",
      size: "1024x1024"
    });
    expect(result.isFallback).toBe(false);
    expect(result.model).toBe("gpt-image-2");
    expect(result.url).toMatch(/^\/generated\/task-real-image\/asset-/);

    const savedBytes = await readFile(join(root, "public", result.url.replace(/^\//, "")));
    expect(savedBytes.toString()).toBe("real generated image");
  });
});
