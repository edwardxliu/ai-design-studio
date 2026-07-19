import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFetchImageApiClient, createImageProvider } from "./image-provider";
import { createLocalAssetStore } from "./local-asset-store";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

describe("createImageProvider", () => {
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
      apiKey: "test-key",
      model: "gpt-image-2",
      imageStore: store,
      clientFactory: () => ({ images: { generate, edit: vi.fn() } })
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

  it("uses the edit endpoint with reference images when source images are provided", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-generated-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({
      dataDir: join(root, "data"),
      publicDir: join(root, "public")
    });
    const generate = vi.fn();
    const edit = vi.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("edited image").toString("base64") }]
    });

    const provider = createImageProvider({
      apiKey: "test-key",
      model: "gpt-image-1",
      imageStore: store,
      clientFactory: () => ({ images: { generate, edit } })
    });

    const result = await provider.editImage({
      taskId: "task-edit-ref",
      prompt: "Attach the POP artwork to the product front panel",
      sourceAssetIds: ["asset-product", "asset-pop-flat"],
      sourceImages: [
        { bytes: Buffer.from("product photo"), contentType: "image/png", filename: "product.png" },
        { bytes: Buffer.from("pop artwork"), contentType: "image/svg+xml", filename: "pop.svg" }
      ]
    });

    expect(generate).not.toHaveBeenCalled();
    expect(edit).toHaveBeenCalledTimes(1);
    const editRequest = edit.mock.calls[0][0];
    expect(editRequest.model).toBe("gpt-image-1");
    expect(editRequest.images.map((image: { filename: string }) => image.filename)).toEqual([
      "product.png",
      "pop.svg"
    ]);
    expect(result.isFallback).toBe(false);
    expect(result.url).toMatch(/^\/generated\/task-edit-ref\/asset-/);
  });


  it("sends image edits as multipart form data", async () => {
    let contentType = "";
    let bodyText = "";
    const server = createServer((request, response) => {
      contentType = String(request.headers["content-type"] ?? "");
      const chunks: Buffer[] = [];
      request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      request.on("end", () => {
        bodyText = Buffer.concat(chunks).toString("utf8");
        response.end(JSON.stringify({ data: [] }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Local server did not bind to a TCP port.");
    }

    vi.stubEnv("OPENAI_PROXY_URL", "");
    vi.stubEnv("HTTPS_PROXY", "");
    vi.stubEnv("HTTP_PROXY", "");
    vi.stubEnv("ALL_PROXY", "");

    try {
      const client = createFetchImageApiClient(
        "test-key",
        `http://127.0.0.1:${address.port}`
      );
      await client.images.edit({
        model: "gpt-image-2",
        prompt: "Attach POP artwork to the product",
        size: "1024x1024",
        images: [{ bytes: Buffer.from("png"), contentType: "image/png", filename: "input.png" }],
        mask: { bytes: Buffer.from("mask"), contentType: "image/png", filename: "mask.png" }
      });

      expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
      expect(bodyText).toContain('name="image[]"; filename="input.png"');
      expect(bodyText).toContain('name="mask"; filename="mask.png"');
    } finally {
      vi.unstubAllGlobals();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
  it("falls back to the official API root when the configured base URL is blank", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENAI_PROXY_URL", "");
    vi.stubEnv("HTTPS_PROXY", "");
    vi.stubEnv("HTTP_PROXY", "");
    vi.stubEnv("ALL_PROXY", "");

    try {
      const client = createFetchImageApiClient("test-key", "   ");
      await client.images.generate({
        model: "gpt-image-1",
        prompt: "Generate a product image",
        size: "1024x1024"
      });

      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://api.openai.com/v1/images/generations"
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("throws the failure reason when the API call fails", async () => {
    const generate = vi.fn().mockRejectedValue(new Error("model_not_found: gpt-image-99"));

    const provider = createImageProvider({
      apiKey: "test-key",
      model: "gpt-image-99",
      clientFactory: () => ({ images: { generate, edit: vi.fn() } })
    });

    await expect(
      provider.generateImage({
        taskId: "task-fail",
        prompt: "Generate a product image",
        sourceAssetIds: []
      })
    ).rejects.toThrow("model_not_found");
  });

  it("throws a clear error when no api key is configured", async () => {
    const provider = createImageProvider({ apiKey: "" });

    await expect(
      provider.generateImage({
        taskId: "task-no-key",
        prompt: "Generate any product image",
        sourceAssetIds: []
      })
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });

});
