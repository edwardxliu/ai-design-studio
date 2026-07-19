import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDoubaoImageProvider,
  normalizeArkApiRoot,
  toDoubaoSize
} from "./doubao-image-provider";
import { createLocalAssetStore } from "./local-asset-store";

const tempRoots: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

describe("Doubao image provider", () => {
  it("sends local references as base64 and persists the result", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-doubao-"));
    tempRoots.push(root);
    const store = createLocalAssetStore({ dataDir: join(root, "data"), publicDir: join(root, "public") });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        model: "doubao-seedream-5-0-lite-260128",
        data: [{ b64_json: Buffer.from("doubao output").toString("base64") }]
      }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("ARK_PROXY_URL", "");
    vi.stubEnv("HTTPS_PROXY", "");
    vi.stubEnv("HTTP_PROXY", "");
    vi.stubEnv("ALL_PROXY", "");

    const provider = createDoubaoImageProvider({
      apiKey: "ark-test-key",
      baseUrl: "https://ark.example/api/v3/",
      imageStore: store
    });
    const result = await provider.editImage({
      taskId: "task-doubao-edit",
      prompt: "Keep the uploaded product unchanged",
      sourceAssetIds: ["asset-product"],
      sourceImages: [
        { bytes: Buffer.from("product"), contentType: "image/png", filename: "product.png" }
      ],
      maskImage: { bytes: Buffer.from("mask"), contentType: "image/png", filename: "mask.png" },
      size: "1536x1024"
    });

    expect(fetchMock.mock.calls[0][0]).toBe("https://ark.example/api/v3/images/generations");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({
      model: "doubao-seedream-5-0-lite-260128",
      size: "2304x1536",
      response_format: "b64_json",
      watermark: false
    });
    expect(body.image).toHaveLength(2);
    expect(body.image[0]).toMatch(/^data:image\/png;base64,/);
    expect(body.image[1]).toBe(`data:image/png;base64,${Buffer.from("mask").toString("base64")}`);
    expect(result.model).toBe("doubao-seedream-5-0-lite-260128");
    const bytes = await readFile(join(root, "public", result.url.replace(/^\//, "")));
    expect(bytes.toString()).toBe("doubao output");
  });

  it("uses the official root and reports missing credentials", async () => {
    expect(normalizeArkApiRoot("  ")).toBe("https://ark.cn-beijing.volces.com/api/v3");
    expect(toDoubaoSize("1024x1536")).toBe("1536x2304");
    const provider = createDoubaoImageProvider({ apiKey: "" });
    await expect(provider.generateImage({ taskId: "x", prompt: "p", sourceAssetIds: [] }))
      .rejects.toThrow(/ARK_API_KEY/);
  });
});
