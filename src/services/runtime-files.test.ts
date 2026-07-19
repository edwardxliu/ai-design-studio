import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listRuntimeImages, readRuntimeFile } from "./runtime-files";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

async function createRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "midea-runtime-"));
  tempRoots.push(root);
  return root;
}

describe("readRuntimeFile", () => {
  it("reads a nested file and infers its content type", async () => {
    const root = await createRoot();
    await mkdir(join(root, "task-1"), { recursive: true });
    await writeFile(join(root, "task-1", "output.svg"), "<svg/>");

    const file = await readRuntimeFile(root, ["task-1", "output.svg"]);

    expect(file?.bytes.toString()).toBe("<svg/>");
    expect(file?.contentType).toBe("image/svg+xml");
  });

  it("serves a locally cached Seedance video with the MP4 content type", async () => {
    const root = await createRoot();
    await mkdir(join(root, "video-task"), { recursive: true });
    await writeFile(join(root, "video-task", "hero-film.mp4"), "video");

    const file = await readRuntimeFile(root, ["video-task", "hero-film.mp4"]);

    expect(file?.bytes.toString()).toBe("video");
    expect(file?.contentType).toBe("video/mp4");
  });
  it("returns null for missing files", async () => {
    const root = await createRoot();

    expect(await readRuntimeFile(root, ["nope.png"])).toBeNull();
  });

  it("lists generated images newest-first with public urls", async () => {
    const root = await createRoot();
    await mkdir(join(root, "task-old"), { recursive: true });
    await mkdir(join(root, "task-new"), { recursive: true });
    await writeFile(join(root, "task-old", "old.png"), "old");
    await writeFile(join(root, "task-old", "notes.json"), "{}");
    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(join(root, "task-new", "new.svg"), "<svg/>");

    const images = await listRuntimeImages(root, "/generated");

    expect(images.map((image) => image.url)).toEqual([
      "/generated/task-new/new.svg",
      "/generated/task-old/old.png"
    ]);
    expect(images[0].taskId).toBe("task-new");
    expect(images[0].filename).toBe("new.svg");
    expect(typeof images[0].modifiedAt).toBe("string");
  });

  it("rejects path traversal outside the base directory", async () => {
    const root = await createRoot();
    await writeFile(join(root, "..", "escape.txt"), "secret").catch(() => undefined);

    expect(await readRuntimeFile(root, ["..", "escape.txt"])).toBeNull();
    expect(await readRuntimeFile(root, ["a", "..", "..", "escape.txt"])).toBeNull();
  });
});
