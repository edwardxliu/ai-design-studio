import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSystemSettingsStore, DEFAULT_SYSTEM_SETTINGS } from "./system-settings";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

describe("system settings store", () => {
  it("returns defaults when nothing has been saved", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-settings-"));
    tempRoots.push(root);
    const store = createSystemSettingsStore({ dataDir: root });

    expect(await store.read()).toEqual(DEFAULT_SYSTEM_SETTINGS);
  });

  it("persists the system country and language", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-settings-"));
    tempRoots.push(root);
    const store = createSystemSettingsStore({ dataDir: root });

    await store.save({ country: "Brazil", language: "Portuguese" });

    expect(await store.read()).toEqual({ country: "Brazil", language: "Portuguese" });
  });
});
