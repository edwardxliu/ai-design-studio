// @vitest-environment node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { minify, transform } from "next/dist/build/swc";
import { afterEach, expect, it, vi } from "vitest";
import type { ImageApiClient } from "./image-provider";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("preserves multipart file bytes and CRLF framing after production minification", async () => {
  // Compile the real provider: source-only tests miss the optimizer's array.join rewrite.
  const filename = resolve("src/services/image-provider.ts");
  const source = await readFile(filename, "utf8");
  const compiled = await transform(source, {
    filename,
    jsc: { parser: { syntax: "typescript" }, target: "es2022" },
    module: { type: "commonjs" }
  });
  const optimized = await minify(compiled.code, { compress: true, mangle: true });
  const evaluated = { exports: {} as { createFetchImageApiClient: (apiKey: string, baseUrl: string) => ImageApiClient } };
  new Function("require", "module", "exports", optimized.code)(createRequire(filename), evaluated, evaluated.exports);

  for (const name of ["OPENAI_PROXY_URL", "HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY"]) {
    vi.stubEnv(name, "");
  }
  let captured: RequestInit | undefined;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    captured = init;
    return new Response(JSON.stringify({ data: [] }));
  });
  const images = [
    { bytes: Buffer.from([0, 255, 13, 10, 128, 1]), contentType: "image/png", filename: "产品图.png" },
    { bytes: Buffer.from([255, 216, 0, 13, 10, 255, 217]), contentType: "image/jpeg", filename: "ref-1.jpg" }
  ];
  const mask = { bytes: Buffer.from([0, 255, 0, 255]), contentType: "image/png", filename: "mask.png" };
  await evaluated.exports.createFetchImageApiClient("test-key", "http://127.0.0.1").images.edit({
    model: "test-model",
    prompt: "保持产品外观\nUse reference lighting.",
    size: "1536x1024",
    images,
    mask
  });

  expect(captured).toBeDefined();
  const form = await new Response(captured!.body, { headers: captured!.headers }).formData();
  expect(form.get("model")).toBe("test-model");
  expect(form.get("prompt")).toBe("保持产品外观\nUse reference lighting.");
  expect(form.get("size")).toBe("1536x1024");
  const files = form.getAll("image[]") as File[];
  expect(files).toHaveLength(images.length);
  for (let index = 0; index < images.length; index++) {
    expect(files[index].name).toBe(images[index].filename);
    expect(files[index].type).toBe(images[index].contentType);
    expect(Buffer.from(await files[index].arrayBuffer())).toEqual(images[index].bytes);
  }
  const parsedMask = form.get("mask") as File;
  expect(parsedMask.name).toBe(mask.filename);
  expect(Buffer.from(await parsedMask.arrayBuffer())).toEqual(mask.bytes);
});
